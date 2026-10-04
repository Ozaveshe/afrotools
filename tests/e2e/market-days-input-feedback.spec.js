const { test, expect } = require('@playwright/test');

for (const variant of [{ width: 320, theme: 'dark' }, { width: 390, theme: 'light' }]) {
  test.describe(`${variant.width}px ${variant.theme}`, () => {
    test.use({ viewport: { width: variant.width, height: 900 }, colorScheme: variant.theme });
    test('valid input updates the answer before blur and copy confirmation stays readable', async ({ page, baseURL }, testInfo) => {
      const errors = [], writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(request.method()); });
      const origin = new URL(baseURL).origin;
      await page.route('**/*', route => {
        const request = route.request(), url = new URL(request.url());
        if (url.origin === origin && ['GET', 'HEAD'].includes(request.method()) &&
            !/^\/(?:api\/|\.netlify\/functions\/)/.test(url.pathname)) return route.continue();
        return route.fulfill({ status: 200, body: '', contentType:
          request.resourceType() === 'stylesheet' ? 'text/css' : request.resourceType() === 'script' ? 'application/javascript' : 'text/plain' });
      });
      await page.addInitScript(theme => {
        localStorage.setItem('aft_theme', theme);
        localStorage.setItem('afrotools_cookie_consent', 'declined');
        window.syntheticCopiedURLs = [];
        Object.defineProperty(navigator, 'share', { configurable: true, value: undefined });
        Object.defineProperty(navigator, 'clipboard', { configurable: true,
          value: { writeText: value => { window.syntheticCopiedURLs.push(value); return Promise.resolve(); } } });
      }, variant.theme);
      await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
      await page.goto('/tools/market-days/');
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
      await expect(page.locator('#selectedDayName')).toHaveText('Orie');
      const input = page.getByLabel('Pick any Gregorian date', { exact: true });
      await input.fill('2026-01-04');
      await expect(input).toBeFocused();
      await expect(page.locator('#selectedDayName')).toHaveText('Eke');
      await expect(page.locator('#selectedDateMeta')).toContainText('4 January 2026');
      await expect(page.locator('[data-date-key="2026-01-04"]')).toHaveAttribute('aria-pressed', 'true');
      await expect(page.locator('#tripStatus')).toContainText('Trip brief ready');
      await page.locator('#shareView').click();
      await expect(page.locator('#shareStatus')).toContainText('copied');
      const copied = await page.evaluate(() => window.syntheticCopiedURLs);
      expect(copied).toHaveLength(1);
      expect(new URL(copied[0]).searchParams.get('date')).toBe('2026-01-04');
      const contrast = await page.locator('#shareStatus').evaluate(node => {
        const rgb = value => value.match(/[\d.]+/g).map(Number);
        const foreground = rgb(getComputedStyle(node).color);
        let ancestor = node, background;
        while (ancestor) {
          const candidate = rgb(getComputedStyle(ancestor).backgroundColor);
          if ((candidate[3] ?? 1) === 1) { background = candidate; break; }
          ancestor = ancestor.parentElement;
        }
        if (!background) throw new Error('No opaque status background found');
        const luminance = channels => channels.slice(0, 3).map(value => value / 255)
          .map(value => value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4)
          .reduce((sum, value, index) => sum + value * [0.2126, 0.7152, 0.0722][index], 0);
        const a = luminance(foreground), b = luminance(background);
        return { foreground, background, opacity: getComputedStyle(node).opacity,
          ratio: (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05) };
      });
      expect(contrast.opacity).toBe('1');
      expect(contrast.foreground[3] ?? 1).toBe(1);
      expect(contrast.ratio).toBeGreaterThanOrEqual(4.5);
      await testInfo.attach('native-feedback-contrast', { body: JSON.stringify(contrast), contentType: 'application/json' });
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true);
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
      await page.locator('.spotlight-card').screenshot({ path: testInfo.outputPath(`input-feedback-${variant.width}-${variant.theme}.png`) });
    });
  });
}
