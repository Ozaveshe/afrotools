const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { expect, test } = require('@playwright/test');

function healthRoutes() {
  const registryPath = path.resolve(__dirname, '../../assets/js/components/tool-registry.js');
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(registryPath, 'utf8'), sandbox);
  const routes = sandbox.AFRO_TOOLS
    .filter((tool) => (tool.lang || 'en') === 'en' && tool.category === 'health')
    .map((tool) => tool.href);

  if (routes.length !== 42 || new Set(routes).size !== 42) {
    throw new Error(`Expected 42 unique English Health apps, found ${routes.length}`);
  }
  return routes;
}

const HEALTH_ROUTES = healthRoutes();
const SCENARIOS = [
  { name: 'desktop light', width: 1440, height: 1000, theme: 'light', fontSize: '100%' },
  { name: '320px dark', width: 320, height: 844, theme: 'dark', fontSize: '100%' },
  { name: '375px dark at 200% text', width: 375, height: 844, theme: 'dark', fontSize: '200%' },
];

test.describe('Day 5 Health category hub VIP contract', () => {
  for (const scenario of SCENARIOS) {
    test(`${scenario.name} keeps the directory discoverable and usable`, async ({ page }) => {
      const errors = [];
      const remoteFontRequests = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      page.on('request', (request) => {
        if (/fonts\.(googleapis|gstatic)\.com/i.test(request.url())) {
          remoteFontRequests.push(request.url());
        }
      });

      await page.setViewportSize({ width: scenario.width, height: scenario.height });
      await page.emulateMedia({ colorScheme: scenario.theme, reducedMotion: 'reduce' });
      await page.addInitScript((theme) => {
        localStorage.setItem('aft_theme', theme);
      }, scenario.theme);

      const response = await page.goto('/health/', { waitUntil: 'domcontentloaded' });
      expect(response && response.status()).toBe(200);
      await page.evaluate(({ theme, fontSize }) => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.style.fontSize = fontSize;
      }, scenario);
      await page.locator('#registry-groups .registry-pills a').first().waitFor();

      await expect(page.locator('main')).toHaveCount(1);
      await expect(page.locator('h1')).toHaveCount(1);
      await expect(page.locator('#hero-registry-count')).toHaveText('42');
      await expect(page.locator('#registry-groups .registry-pills a')).toHaveCount(42);
      await expect(page.getByText('Medical-information boundary', { exact: true })).toBeVisible();
      await expect(page.getByText('Privacy boundary', { exact: true })).toBeVisible();
      await expect(page.getByText('Source and freshness boundary', { exact: true })).toBeVisible();

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
        const hasName = (element) => {
          if ((element.textContent || '').trim() || element.getAttribute('aria-label')) return true;
          if (element.labels && Array.from(element.labels).some((label) => label.textContent.trim())) return true;
          return Boolean(element.getAttribute('title'));
        };
        const controls = Array.from(document.querySelectorAll(
          'main button, main input:not([type="hidden"]), main select, main textarea'
        )).filter(visible);
        return {
          missingRoutes: expectedRoutes.filter((route) => !links.has(route)),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          unnamedControls: controls
            .filter((control) => !hasName(control))
            .map((control) => `${control.tagName.toLowerCase()}#${control.id || '(no-id)'}`),
          emptyLinks: Array.from(document.querySelectorAll('main a[href]'))
            .filter((link) => !hasName(link))
            .map((link) => link.getAttribute('href')),
        };
      }, HEALTH_ROUTES);

      expect(audit.missingRoutes).toEqual([]);
      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamedControls).toEqual([]);
      expect(audit.emptyLinks).toEqual([]);
      expect(remoteFontRequests).toEqual([]);
      expect(errors).toEqual([]);
    });
  }
});
