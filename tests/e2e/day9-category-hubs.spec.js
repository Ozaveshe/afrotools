const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { expect, test } = require('@playwright/test');

function registryRoutes(category) {
  const registryPath = path.resolve(__dirname, '../../assets/js/components/tool-registry.js');
  const sandbox = { document: undefined, window: {} };
  vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(registryPath, 'utf8'), sandbox);
  return sandbox.AFRO_TOOLS
    .filter((tool) => (
      (tool.lang || 'en') === 'en'
      && tool.category === category
      && ['live', 'new'].includes(tool.status)
    ))
    .map((tool) => tool.href);
}

const HUBS = [
  { name: 'Creative', route: '/creative/', category: 'creative', selector: '#bucket-sections a[href^="/tools/"]' },
  { name: 'Sports', route: '/sports/', category: 'sports', selector: 'main a.en-tool-card' },
  { name: 'Travel', route: '/travel/', category: 'travel-tourism', selector: '.en-tools-grid a.en-tool-card' },
];

for (const hub of HUBS) {
  for (const scenario of [
    { label: '320px system dark', width: 320, scheme: 'dark', manualTheme: null, scale: '100%' },
    { label: '375px manual dark 200%', width: 375, scheme: 'light', manualTheme: 'dark', scale: '200%' },
  ]) {
    test(`${hub.name} hub: ${scenario.label}`, async ({ page }) => {
      const errors = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));

      await page.setViewportSize({ width: scenario.width, height: 844 });
      await page.emulateMedia({ colorScheme: scenario.scheme, reducedMotion: 'reduce' });
      if (scenario.manualTheme) {
        await page.addInitScript((theme) => {
          localStorage.setItem('aft_theme', theme);
        }, scenario.manualTheme);
      }

      const response = await page.goto(hub.route, { waitUntil: 'domcontentloaded' });
      expect(response && response.status()).toBe(200);
      await page.waitForLoadState('networkidle');
      await page.evaluate(({ manualTheme, scale }) => {
        if (manualTheme) document.documentElement.setAttribute('data-theme', manualTheme);
        document.documentElement.style.fontSize = scale;
      }, scenario);

      const expectedRoutes = registryRoutes(hub.category);
      await expect(page.locator(hub.selector)).toHaveCount(expectedRoutes.length);
      await expect(page.locator('h1')).toHaveCount(1);

      const audit = await page.evaluate((routes) => {
        const linked = new Set(
          Array.from(document.querySelectorAll('a[href]'), (link) => link.getAttribute('href'))
        );
        const visible = (element) => {
          const style = getComputedStyle(element);
          const rect = element.getBoundingClientRect();
          return style.display !== 'none' && style.visibility !== 'hidden'
            && rect.width > 0 && rect.height > 0;
        };
        const named = (element) => Boolean(
          (element.textContent || '').trim()
          || element.getAttribute('aria-label')
          || element.getAttribute('title')
          || (element.labels && Array.from(element.labels).some((label) => label.textContent.trim()))
        );
        const controls = Array.from(document.querySelectorAll(
          'button, input:not([type="hidden"]), select, textarea'
        )).filter(visible);
        return {
          missingRoutes: routes.filter((route) => !linked.has(route)),
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          unnamedControls: controls.filter((control) => !named(control)).length,
        };
      }, expectedRoutes);

      expect(audit.missingRoutes).toEqual([]);
      expect(audit.overflow).toBeLessThanOrEqual(1);
      expect(audit.unnamedControls).toBe(0);
      expect(errors).toEqual([]);
    });
  }
}
