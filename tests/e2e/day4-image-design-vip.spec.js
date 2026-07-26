const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { expect, test } = require('@playwright/test');

function imageDesignRoutes() {
  const registryPath = path.resolve(__dirname, '../../assets/js/components/tool-registry.js');
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(registryPath, 'utf8'), sandbox);

  const apps = sandbox.AFRO_TOOLS
    .filter((tool) => (tool.lang || 'en') === 'en')
    .filter((tool) => tool.category === 'image-design')
    .map((tool) => tool.href);

  if (apps.length !== 19 || new Set(apps).size !== 19) {
    throw new Error(`Expected 19 unique English Image & Design apps, found ${apps.length}`);
  }

  return ['/image-design/', ...apps];
}

const ROUTES = imageDesignRoutes();
const SCENARIOS = [
  { name: '320px light', width: 320, theme: 'light', textScale: '100%' },
  { name: '375px dark at 200% text', width: 375, theme: 'dark', textScale: '200%' },
];

function controlAudit() {
  const visible = (element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.visibility !== 'hidden'
      && style.display !== 'none'
      && rect.width > 0
      && rect.height > 0;
  };
  const text = (element) => (element.textContent || '').trim();
  const referencedText = (element) => {
    const ids = (element.getAttribute('aria-labelledby') || '').split(/\s+/).filter(Boolean);
    return ids.map((id) => text(document.getElementById(id) || document.createElement('span'))).join(' ');
  };
  const hasName = (element) => {
    if (text(element)
      || element.getAttribute('aria-label')
      || referencedText(element)
      || element.getAttribute('title')) return true;
    if (element.labels && Array.from(element.labels).some((label) => text(label))) return true;
    if (element.tagName === 'INPUT') {
      const type = (element.getAttribute('type') || 'text').toLowerCase();
      return Boolean(element.getAttribute('placeholder'))
        || (['button', 'submit', 'reset'].includes(type) && Boolean(element.value))
        || (type === 'image' && Boolean(element.getAttribute('alt')));
    }
    return false;
  };

  const controls = Array.from(document.querySelectorAll(
    'main button, main input:not([type="hidden"]), main select, main textarea'
  )).filter(visible);

  return {
    unnamed: controls
      .filter((element) => !hasName(element))
      .map((element) => `${element.tagName.toLowerCase()}#${element.id || '(no-id)'}`),
    undersizedButtons: controls
      .filter((element) => element.tagName === 'BUTTON')
      .filter((element) => {
        const rect = element.getBoundingClientRect();
        return rect.width < 44 || rect.height < 44;
      })
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return `${element.id || text(element).slice(0, 30)}:${Math.round(rect.width)}x${Math.round(rect.height)}`;
      }),
  };
}

test.describe('Day 4 Image & Design VIP regression', () => {
  test.describe.configure({ mode: 'parallel' });

  for (const route of ROUTES) {
    test(`${route} keeps its mobile, dark, SEO and accessibility contracts`, async ({ page }) => {
      test.setTimeout(90_000);
      const consoleErrors = [];
      const pageErrors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') consoleErrors.push(message.text());
      });
      page.on('pageerror', (error) => pageErrors.push(error.message));

      for (const scenario of SCENARIOS) {
        await page.setViewportSize({ width: scenario.width, height: 844 });
        await page.emulateMedia({ colorScheme: scenario.theme });
        const response = await page.goto(route, { waitUntil: 'domcontentloaded' });
        expect(response && response.status(), `${route} ${scenario.name} HTTP status`).toBe(200);

        await page.evaluate(({ theme, textScale }) => {
          document.documentElement.setAttribute('data-theme', theme);
          document.documentElement.style.fontSize = textScale;
        }, scenario);

        await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.theme);
        await expect(page.locator('h1')).toHaveCount(1);
        expect(await page.locator('main,[role="main"]').count(), `${route} main landmark`).toBeGreaterThan(0);
        await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', /^https:\/\/afrotools\.com\//);

        const pageAudit = await page.evaluate(() => {
          const schemas = Array.from(document.querySelectorAll('script[type="application/ld+json"]'))
            .map((script) => {
              try {
                JSON.parse(script.textContent);
                return null;
              } catch (error) {
                return error.message;
              }
            })
            .filter(Boolean);
          return {
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            schemaErrors: schemas,
            overflowElements: Array.from(document.querySelectorAll('body *'))
              .map((element) => {
                const rect = element.getBoundingClientRect();
                return {
                  element: `${element.tagName.toLowerCase()}${element.id ? `#${element.id}` : ''}${element.classList.length ? `.${Array.from(element.classList).join('.')}` : ''}`,
                  left: Math.round(rect.left),
                  right: Math.round(rect.right),
                  width: Math.round(rect.width),
                };
              })
              .filter((entry) => entry.left < -1 || entry.right > document.documentElement.clientWidth + 1)
              .sort((a, b) => (b.right - document.documentElement.clientWidth) - (a.right - document.documentElement.clientWidth))
              .slice(0, 8),
          };
        });
        const controls = await page.evaluate(controlAudit);

        expect(
          pageAudit.overflow,
          `${route} ${scenario.name} horizontal overflow: ${JSON.stringify(pageAudit.overflowElements)}`
        ).toBeLessThanOrEqual(1);
        expect(pageAudit.schemaErrors, `${route} ${scenario.name} JSON-LD`).toEqual([]);
        expect(controls.unnamed, `${route} ${scenario.name} unnamed controls`).toEqual([]);
        expect(controls.undersizedButtons, `${route} ${scenario.name} button targets`).toEqual([]);
        expect(pageErrors, `${route} ${scenario.name} page errors`).toEqual([]);
        expect(consoleErrors, `${route} ${scenario.name} console errors`).toEqual([]);
      }
    });
  }

  test('hub reconciles the English and all-language inventories', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 844 });
    await page.goto('/image-design/', { waitUntil: 'domcontentloaded' });

    await expect(page.locator('#tool-grid .tool-card:visible')).toHaveCount(19);
    await expect(page.locator('#search-label')).toHaveText('19 apps in view');

    const itemList = await page.evaluate(() => Array.from(
      document.querySelectorAll('script[type="application/ld+json"]')
    ).map((script) => JSON.parse(script.textContent))
      .find((schema) => schema['@type'] === 'ItemList'));
    expect(itemList.numberOfItems).toBe(78);
    expect(itemList.itemListElement).toHaveLength(78);

    await page.getByRole('button', { name: 'All apps' }).click();
    await expect(page.locator('#tool-grid .tool-card:visible')).toHaveCount(78);
    await expect(page.locator('#search-label')).toHaveText('78 apps in view');
  });
});
