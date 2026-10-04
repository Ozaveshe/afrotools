const { test, expect } = require('@playwright/test');

test.use({ timezoneId: 'Africa/Lagos', serviceWorkers: 'block' });

for (const [width, theme] of [[320, 'dark'], [390, 'light']]) {
  for (const invalidDate of ['2026-02-31', '2026-02-29', '2026-13-01', '2026-00-01', '2026-04-31', '2026-01-00']) {
    test(`invalid URL ${invalidDate} recovers to Nigeria today at ${width}px ${theme}`, async ({ page, baseURL }, testInfo) => {
      const pageErrors = [];
      const writes = [];
      page.on('pageerror', error => pageErrors.push(error.message));
      const origin = new URL(baseURL).origin;
      await page.route('**/*', route => {
        const request = route.request();
        if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.method());
        const url = new URL(request.url());
        return url.origin === origin && ['GET', 'HEAD'].includes(request.method()) &&
          !/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)
          ? route.continue() : route.abort();
      });
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(value => {
        localStorage.setItem('aft_theme', value);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        window.syntheticCopiedURLs = [];
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
        Object.defineProperty(navigator, 'clipboard', {
          configurable: true,
          value: { writeText: text => { window.syntheticCopiedURLs.push(text); return Promise.resolve(); } }
        });
      }, theme);
      await page.clock.install({ time: new Date('2026-10-04T12:00:00Z') });
      await page.goto(`/tools/market-days/?date=${invalidDate}`, { waitUntil: 'load' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
      await expect(page.getByLabel('Pick any Gregorian date', { exact: true })).toHaveValue('2026-10-04');
      await expect(page.locator('#lookupDate')).toHaveAttribute('aria-invalid', 'false');
      await expect(page.locator('#lookupDateStatus')).toBeEmpty();
      await expect(page.locator('#selectedDateMeta')).toContainText('4 October 2026');
      await expect(page.locator('#monthLabel')).toHaveText('October 2026');
      await expect(page.locator('[data-date-key="2026-10-04"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#tripStatus')).toContainText('Trip brief ready');
      await expect(page.locator('#shareView')).toBeEnabled();
      await page.locator('#shareView').click();
      await expect(page.locator('#shareStatus')).toContainText('copied');
      const copied = await page.evaluate(() => window.syntheticCopiedURLs);
      expect(copied).toHaveLength(1);
      expect(new URL(copied[0]).searchParams.get('date')).toBe('2026-10-04');
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(pageErrors).toEqual([]);
      expect(writes).toEqual([]);
      if (invalidDate === '2026-02-31') await page.screenshot({ path: testInfo.outputPath(`invalid-url-${width}-${theme}.png`) });
    });
  }
}
