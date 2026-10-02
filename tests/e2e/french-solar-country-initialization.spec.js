const { test, expect } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

for (const width of [1365, 390, 320]) {
  for (const locale of ['en', 'fr']) {
    test(`Solar country choice is available only after handlers are ready ${locale} ${width}`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
      const route = locale === 'fr' ? '/fr/tools/roi-solaire/kenya/' : '/tools/solar-roi/kenya/';
      const root = process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT === '1' ? 'dist' : '.';
      const html = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
      const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)];
      const controller = scripts.find(row => row[1].includes('function setupCountryPicker('));
      expect(controller, 'The fixture exercises the actual generated controller').toBeTruthy();
      let releaseController;
      const held = new Promise(resolve => { releaseController = resolve; });
      await page.route('**/*', async request => {
        const url = new URL(request.request().url());
        if (url.origin !== new URL(baseURL).origin || !['GET', 'HEAD', 'OPTIONS'].includes(request.request().method())) return request.abort();
        if (url.pathname === route) return request.fulfill({ contentType: 'text/html', body: html.replace(controller[0], '<script defer src="/__test_solar_country_controller.js"></script>') });
        if (url.pathname === '/__test_solar_country_controller.js') {
          await held;
          return request.fulfill({ contentType: 'application/javascript', body: controller[1] });
        }
        return request.continue();
      });
      try {
        await page.goto(route, { waitUntil: 'commit' });
        const select = page.locator('#solarCountryPageSelect');
        const search = page.locator('#solarCountryPageSearch');
        await expect(select).toBeDisabled();
        await expect(search).toBeDisabled();
        releaseController();
        await expect(select).toBeEnabled();
        await expect(search).toBeEnabled();
        await select.selectOption('nigeria');
        const expected = locale === 'fr' ? '/fr/tools/roi-solaire/nigeria/' : '/tools/solar-roi/nigeria/';
        await expect(page.locator('#solarCountryPageOpen')).toHaveAttribute('href', expected);
        await expect(select).toHaveValue('nigeria');
        await page.waitForLoadState('load');
        await expect(page.locator('#solarCountryPageOpen')).toHaveAttribute('href', expected);
        await expect(select).toHaveValue('nigeria');
        await search.fill('Ghana');
        await expect(select).toHaveValue('ghana');
      } finally { releaseController(); }
    });
  }
}
