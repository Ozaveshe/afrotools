const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });

for (const route of ['/tools/solar-roi/kenya/', '/fr/tools/roi-solaire/kenya/']) {
  test('Solar ROI keyboard calculation and correction on ' + route, async ({ page }) => {
    await page.goto(route);
    const bill = page.locator('#monthlyBill');
    const results = page.locator('#mobileResultsBtn');
    await bill.fill('9150');
    await results.focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('#results-title')).toBeFocused();

    await bill.fill('-5');
    await results.focus();
    await page.keyboard.press('Enter');
    await expect(bill).toBeFocused();
    await expect(bill).toBeInViewport();
    await expect(bill).toHaveAttribute('aria-invalid', 'true');

    const search = page.locator('#solarCountryPageSearch');
    await search.fill('no-such-country');
    await search.press('Enter');
    await expect(search).toHaveValue('no-such-country');
    await expect(bill).toHaveValue('-5');
  });
}
