const { test, expect } = require('@playwright/test');

const routes = [
  '/',
  '/salary-tax/',
  '/fr/',
  '/sw/',
  '/tools/break-even/',
  '/tools/startup-runway/',
  '/tools/stock-portfolio/',
  '/tools/vat-calculator/',
  '/tools/zulu-translator/',
  '/tools/solar-calculator/'
];

test.describe('sitewide typography delivery', () => {
  for (const routePath of routes) {
    test(`${routePath} loads DM Sans from AfroTools when Google Fonts is unavailable`, async ({ page }) => {
      await page.route('https://fonts.googleapis.com/**', (route) => route.abort());
      await page.route('https://fonts.gstatic.com/**', (route) => route.abort());
      await page.goto(routePath, { waitUntil: 'domcontentloaded' });

      const result = await page.evaluate(async () => {
        const probe = document.createElement('span');
        probe.textContent = 'AfroTools typography probe';
        probe.style.cssText = [
          'position:fixed',
          'left:-9999px',
          'font-family:"DM Sans",sans-serif',
          'font-size:16px',
          'font-weight:400'
        ].join(';');
        document.body.appendChild(probe);

        const loaded = await document.fonts.load('400 16px "DM Sans"', probe.textContent);
        await document.fonts.ready;
        return {
          faceCount: loaded.length,
          resources: performance.getEntriesByType('resource')
            .map((entry) => entry.name)
            .filter((url) => /\/assets\/fonts\/.*\.(?:css|woff2)(?:\?|$)/.test(url))
        };
      });

      expect(result.faceCount).toBeGreaterThan(0);
      expect(result.resources.some((url) => url.includes('/assets/fonts/typography.css'))).toBe(true);
      expect(result.resources.some((url) => url.includes('/assets/fonts/dm-sans/dm-sans-latin.woff2'))).toBe(true);
    });
  }
});
