const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { expect, test } = require('@playwright/test');

function educationRoutes() {
  const registryPath = path.resolve(__dirname, '../../assets/js/components/tool-registry.js');
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(registryPath, 'utf8'), sandbox);

  const routes = sandbox.AFRO_TOOLS
    .filter((tool) => (tool.lang || 'en') === 'en')
    .filter((tool) => tool.category === 'education')
    .map((tool) => tool.href);

  if (routes.length !== 42 || new Set(routes).size !== 42) {
    throw new Error(`Expected 42 unique English Education apps, found ${routes.length}`);
  }

  return routes;
}

const EDUCATION_ROUTES = educationRoutes();

test.describe('Day 5 Education category hub VIP contract', () => {
  for (const scenario of [
    { name: '360px dark', width: 360, theme: 'dark', textScale: '100%' },
    { name: '375px dark at 200% text', width: 375, theme: 'dark', textScale: '200%' },
  ]) {
    test(`${scenario.name} keeps every app discoverable and usable`, async ({ page }) => {
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      await page.setViewportSize({ width: scenario.width, height: 844 });
      await page.emulateMedia({ colorScheme: scenario.theme, reducedMotion: 'reduce' });
      await page.addInitScript(() => localStorage.setItem('aft_theme', 'dark'));
      const response = await page.goto('/education/', { waitUntil: 'domcontentloaded' });
      expect(response && response.status()).toBe(200);

      await page.evaluate(({ theme, textScale }) => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.fontSize = textScale;
      }, scenario);

      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('#hero-registry-count')).toHaveText('42');
      await expect(page.locator('.product-card')).toHaveCount(3);
      await expect(page.locator('.route-card')).toHaveCount(4);
      await expect(page.locator('.tool-card')).toHaveCount(31);

      const audit = await page.evaluate((expectedRoutes) => {
        const links = new Set(
          Array.from(document.querySelectorAll('main a[href]'))
            .map((link) => link.getAttribute('href'))
        );
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none'
            && style.visibility !== 'hidden'
            && rect.width > 0
            && rect.height > 0;
        };
        const name = (element) => {
          if ((element.textContent || '').trim() || element.getAttribute('aria-label')) return true;
          if (element.labels && Array.from(element.labels).some((label) => label.textContent.trim())) return true;
          return Boolean(element.getAttribute('title') || element.getAttribute('placeholder'));
        };
        const controls = Array.from(document.querySelectorAll(
          'main button, main input:not([type="hidden"]), main select, main textarea'
        )).filter(visible);

        return {
          missingRoutes: expectedRoutes.filter((route) => !links.has(route)),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          unnamedControls: controls
            .filter((control) => !name(control))
            .map((control) => `${control.tagName.toLowerCase()}#${control.id || '(no-id)'}`),
        };
      }, EDUCATION_ROUTES);

      expect(audit.missingRoutes).toEqual([]);
      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamedControls).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
});
