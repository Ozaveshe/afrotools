const { test, expect } = require('@playwright/test');

for (const locale of ['en', 'fr']) {
  for (const width of [375, 1280]) {
    test(`${locale} fuel country leads to a usable local-price calculator at ${width}px`, async ({ page, baseURL }) => {
      await page.setViewportSize({ width, height: 844 });
      const errors = [];
      const writes = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('request', request => { if (request.method() !== 'GET') writes.push(request.method()); });
      await page.route('**/*', route => new URL(route.request().url()).origin === new URL(baseURL).origin ? route.continue() : route.abort());
      const country = locale === 'fr' ? '/fr/tools/suivi-carburant/burkina-faso/' : '/tools/fuel-tracker/burkina-faso/';
      const calculator = locale === 'fr' ? '/fr/tools/couts-secours-energie/' : '/tools/backup-power-costs/';
      await page.goto(country, { waitUntil: 'networkidle' });
      await expect(page.locator('.fuel-country-hero h1')).toHaveCSS('color', 'rgb(20, 32, 24)');
      await expect(page.locator('.fuel-trust')).toContainText(locale === 'fr' ? 'Ne constitue pas un prix actuel' : 'Not a current station quote');
      await page.locator('.fuel-actions a[href="#related-countries"]').click();
      await expect(page).toHaveURL(new RegExp('#related-countries$'));
      await expect(page.locator('#related-countries')).toBeInViewport();
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      await page.locator(`.fuel-actions a[href="${calculator}"]`).click();
      await expect(page).toHaveURL(new URL(calculator, baseURL).href);
      await page.locator('#bpCurrency').fill('XOF');
      await page.locator('#bpHours').fill('2');
      await page.locator('#bpDays').fill('10');
      await page.locator('#bpFuelUse').fill('1.5');
      await page.locator('#bpFuelPrice').fill('700');
      await page.locator('#bpGeneratorMaintenance').fill('0');
      await page.locator('#bpPlanner button[type="submit"]').click();
      await expect(page.locator('#bpResults')).toBeVisible();
      const amount = await page.locator('#bpGenerator').innerText();
      expect(amount.replace(/[^0-9]/g, '')).toMatch(/^21000(?:00)?$/);
      await expect(page.locator('#bpFuelUnits')).toHaveText('30.00');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(errors).toEqual([]);
      expect(writes).toEqual([]);
    });
  }
}
