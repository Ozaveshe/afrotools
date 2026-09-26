const { test, expect } = require('@playwright/test');
// This checks result identity; reduced motion prevents smooth auto-scroll moving the click target.
test.use({ reducedMotion: 'reduce' });
const routes = { en: '/tools/electricity-tariff/', fr: '/fr/tools/tarifs-electricite/', sw: '/sw/zana/kikokotoo-tariff-ya-umeme/' };
for (const [locale, route] of Object.entries(routes)) {
  test(`${locale} electricity estimates stay tied to current inputs and source`, async ({ page, baseURL }) => {
    await page.setViewportSize({ width: 320, height: 800 });
    await page.addInitScript(() => { window.__AFROTOOLS_ELECTRICITY_AS_OF__ = '2026-08-15'; });
    const origin = new URL(baseURL).origin;
    await page.route('**/*', request => new URL(request.request().url()).origin === origin ? request.continue() : request.abort());
    await page.goto(route);
    await page.waitForFunction(() => window.AFROTOOLS_ELECTRICITY_READY === true);
    if (await page.locator('#afro-cc-decline').isVisible()) await page.locator('#afro-cc-decline').click();
    const result = page.locator('#electricityResult');
    const primary = page.locator('#electricityPrimary');
    const calculate = async () => {
      await page.locator('.electricity-button').click();
      await expect(result).toBeVisible();
    };
    await calculate();
    await expect(primary).toContainText('12.83 kWh');
    await page.locator('#electricityAmount').fill('20000');
    await expect(result).toBeHidden();
    await calculate();
    await expect(primary).toContainText('25.66 kWh');
    await page.locator('#electricityCountry').selectOption('GH');
    await expect(result).toBeHidden();
    await expect(page.locator('#electricityCustom')).toBeVisible();
    await page.locator('#electricityCustomRate').fill('2.5');
    await page.locator('#electricityCustomFixed').fill('10');
    await page.locator('#electricityCustomTax').fill('10');
    await page.locator('#electricityAmount').fill('66');
    await calculate();
    await expect(primary).toContainText('20 kWh');
    for (const [id, value] of [['electricityCustomRate','3'],['electricityCustomFixed','11'],['electricityCustomTax','11'],['electricityPercentDeduction','1'],['electricityFixedDeduction','1']]) {
      await page.locator('#' + id).fill(value);
      await expect(result).toBeHidden();
      await calculate();
      await expect(result).toBeVisible();
    }
    await page.locator('#electricityCustomCurrency').selectOption('USD');
    await expect(result).toBeHidden();
    await page.locator('#electricityCountry').selectOption('UG');
    await page.locator('input[name="electricityMode"][value="units_to_bill"]').check();
    await page.locator('#electricityTariff').selectOption('ug-uedcl-domestic-lifeline-q3-2026');
    await page.locator('#electricityAmount').fill('15');
    await calculate();
    await expect(primary).toContainText('3,750');
    await page.locator('#electricityAmount').fill('16');
    await expect(result).toBeHidden();
    await calculate();
    await expect(primary).toContainText('4,529.4');
    await page.locator('#electricityTariff').selectOption('ug-uedcl-domestic-standard-q3-2026');
    await expect(result).toBeHidden();
    await calculate();
    await expect(primary).toContainText('12,470.4');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1)).toBe(true);
  });
}
