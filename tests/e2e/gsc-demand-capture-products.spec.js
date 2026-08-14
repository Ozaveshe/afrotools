const { test, expect } = require('@playwright/test');

test.describe('GSC demand capture products', () => {
  test.use({ viewport: { width: 360, height: 780 } });

  test('fuel finder is mobile-safe, announces a result, and calculates fill cost', async ({ page }) => {
    await page.goto('/tools/fuel-tracker/');
    await expect(page.locator('h1')).toHaveText('AfroFuel: fuel costs near you');
    await expect(page.locator('#fuel-result-place')).toContainText('Nigeria');
    await expect(page.locator('#fuel-result-granularity')).toContainText('National benchmark for Nigeria');
    await expect(page.locator('#fuel-result-price')).toContainText('NGN');
    await expect(page.locator('#fuel-result-price')).toContainText('litre');
    await expect(page.locator('#fuel-result-comparison')).toContainText('same market');
    await page.locator('#fuel-quantity').fill('10');
    await page.locator('#fuel-fill-calc').click();
    await expect(page.locator('#fuel-fill-status')).toContainText('calculated locally');
    await expect(page.locator('#fuel-fill-result')).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBeFalsy();
  });

  test('location is requested only by the explicit button and raw coordinates are not retained', async ({ page, context }) => {
    await context.grantPermissions(['geolocation']);
    await context.setGeolocation({ latitude: 6.5244, longitude: 3.3792 });
    await page.goto('/tools/fuel-tracker/');
    await expect(page.locator('#fuel-location-status')).toContainText('Location is off');
    await page.locator('#fuel-use-location').click();
    await expect(page.locator('#fuel-location-status')).toContainText('Your coordinates were not retained');
    const storage = await page.evaluate(() => ({ local: Object.keys(localStorage), session: Object.keys(sessionStorage), url: location.href }));
    expect(JSON.stringify(storage)).not.toContain('6.5244');
    expect(JSON.stringify(storage)).not.toContain('3.3792');
  });

  test('PAYE router disambiguates MRA and routes the chosen country', async ({ page }) => {
    await page.goto('/tools/paye-authority-finder/');
    await page.locator('#authority-query').fill('MRA');
    await page.locator('#authority-form button').click();
    await expect(page.locator('#authority-status')).toContainText('more than one country');
    await expect(page.locator('[data-authority-id="mra-malawi"]')).toBeVisible();
    await page.locator('[data-authority-id="mra-malawi"]').click();
    await expect(page.locator('#authority-status')).toContainText('Matched MRA to Malawi');
    await expect(page.locator('[data-open-calculator="mra-malawi"]')).toHaveAttribute('href', '/malawi/mw-paye');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBeFalsy();
  });

  test('French PAYE router is native and disambiguates MRA locally', async ({ page }) => {
    await page.goto('/fr/tools/trouver-administration-paye/');
    await page.locator('#fr-authority-query').fill('MRA');
    await page.locator('[data-authority-form] button[type="submit"]').click();
    await expect(page.locator('[data-authority-status]')).toContainText('plusieurs pays');
    await expect(page.locator('[data-authority-id="mra-malawi"]')).toBeVisible();
    await page.locator('[data-authority-id="mra-malawi"]').click();
    await expect(page.locator('[data-authority-status]')).toContainText('Malawi');
    await expect(page.locator('[data-authority-results] a.primary-action')).toHaveAttribute('href', '/malawi/mw-paye');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBeFalsy();
  });
});
