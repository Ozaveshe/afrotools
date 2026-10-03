const { test, expect } = require('@playwright/test');

for (const variant of [{ width: 320, theme: 'dark' }, { width: 390, theme: 'light' }]) {
  test(`Kenya keeps calculations and chart changes safe while its palette loads at ${variant.width}px ${variant.theme}`, async ({ page, context, baseURL }, testInfo) => {
    const origin = new URL(baseURL).origin;
    const errors = [], writes = [];
    let releasePalette, pendingRequests = 0;
    const paletteReady = new Promise(resolve => { releasePalette = resolve; });
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => { if (!['GET', 'HEAD'].includes(request.method())) writes.push(new URL(request.url()).pathname); });
    await context.route('**/*', async route => {
      const request = route.request(), url = new URL(request.url());
      if (url.origin === origin && ['GET', 'HEAD'].includes(request.method()) && !url.pathname.startsWith('/api/') && !url.pathname.startsWith('/.netlify/')) {
        if (url.pathname === '/assets/js/lib/chart-config.js') { pendingRequests++; await paletteReady; }
        return route.continue();
      }
      if (request.resourceType() === 'stylesheet') return route.fulfill({ status: 200, contentType: 'text/css', body: '' });
      if (request.resourceType() === 'script') return route.fulfill({ status: 200, contentType: 'application/javascript', body: url.hostname === 'cdnjs.cloudflare.com' ? 'window.__paletteTestCharts = []; window.Chart = class { constructor(canvas, config) { window.__paletteTestCharts.push(config); } destroy() {} };' : '' });
      return route.abort();
    });
    await page.setViewportSize({ width: variant.width, height: 844 });
    await page.emulateMedia({ colorScheme: variant.theme, reducedMotion: 'reduce' });
    await page.addInitScript(theme => { localStorage.setItem('aft_theme', theme); localStorage.setItem('afrotools_cookie_consent', 'declined'); }, variant.theme);
    try {
      await page.goto('/kenya/ke-paye', { waitUntil: 'domcontentloaded' });
      await expect(page.locator('html')).toHaveAttribute('data-theme', variant.theme);
      const field = page.locator('#salaryInput'), calculate = page.locator('.calc-btn'), card = page.locator('#resultsCard');
      await field.click(); await expect(field).toBeFocused(); await field.fill('100000'); await expect(field).toHaveValue('100000');
      await calculate.click(); await expect(card).toBeVisible();
      await expect.poll(() => pendingRequests).toBeGreaterThan(0);
      expect(await page.evaluate(() => typeof window.Chart === 'function' && !window.AfroChartColors)).toBe(true);
      await card.getByRole('button', { name: 'Tax Bands', exact: true }).click();
      await field.click(); await expect(field).toBeFocused(); await field.fill('120000'); await expect(field).toHaveValue('120000');
      await calculate.click(); await expect(card).toBeVisible();
      await card.getByRole('button', { name: 'Employer Cost', exact: true }).click();
      const currentAmount = Number((await page.locator('#resAmount').innerText()).replace(/[^0-9.-]/g, ''));
      expect(currentAmount).toBeGreaterThan(0);
      expect(await page.evaluate(() => window.__paletteTestCharts.length)).toBe(0);
      releasePalette();
      await expect.poll(() => page.evaluate(() => window.__paletteTestCharts.length)).toBe(1);
      const chart = await page.evaluate(() => { const value = window.__paletteTestCharts[0]; return { type: value.type, labels: value.data.labels, net: value.data.datasets[0].data[0] }; });
      expect(chart.type).toBe('bar');
      expect(chart.labels).toContain('Employer NSSF');
      expect(chart.net).toBeCloseTo(currentAmount, 0);
      expect(await page.evaluate(() => Math.max(0, document.documentElement.scrollWidth - innerWidth))).toBe(0);
      expect(errors).toEqual([]); expect(writes).toEqual([]);
      await testInfo.attach('pending-palette-checkpoints', { body: JSON.stringify({ ...variant, pendingRequests, currentAmount, chart, errors, writes }, null, 2), contentType: 'application/json' });
    } finally { releasePalette(); }
  });
}
