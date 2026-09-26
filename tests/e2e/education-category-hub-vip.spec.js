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

  if (!routes.length || new Set(routes).size !== routes.length) {
    throw new Error(`Expected unique English Education apps, found ${routes.length}`);
  }

  return routes;
}

const EDUCATION_ROUTES = educationRoutes();

test.describe('Education task hub contract', () => {
  test('search reveals matching groups and clearing restores the directory', async ({ page }) => {
    await page.goto('/education/', { waitUntil: 'domcontentloaded' });
    await page.locator('#education-search').fill('HELB');
    const finance = page.locator('.edu-directory-group').filter({ hasText: 'Pay for education' });
    await expect(finance).toHaveAttribute('open', '');
    await expect(finance.getByRole('link', { name: /Kenya HELB Repayment Worksheet/i })).toBeVisible();
    await expect(page.locator('#education-search-status')).toHaveText('1 tool matches.');
    await page.getByRole('button', { name: 'Clear search and filters' }).click();
    await expect(page.locator('#education-search-status')).toHaveText(`${EDUCATION_ROUTES.length} tools match.`);
    await expect(page.locator('#education-search')).toBeFocused();
    await expect(page.locator('.edu-directory-group[open]')).toHaveCount(1);
  });

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
      await expect(page.locator('.edu-task')).toHaveCount(5);
      await expect(page.locator('.edu-directory-links a')).toHaveCount(EDUCATION_ROUTES.length);
      await expect(page.locator('#education-search')).toBeVisible();

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
