const { test, expect } = require('@playwright/test');

for (const outcome of ['delayed', 'unavailable']) {
  test('a manual VAT extraction survives ' + outcome + ' country presets', async ({ page }) => {
    let release;
    const pending = new Promise(resolve => { release = resolve; });
    await page.route('**/pan-african-vat-presets.json', async route => {
      await pending;
      if (outcome === 'unavailable') await route.fulfill({ status: 503, body: '' });
      else await route.continue();
    });
    await page.goto('/tools/vat-calculator/', { waitUntil: 'domcontentloaded' });
    await page.locator('#modeExtract').click();
    await page.locator('#rate').fill('15');
    await page.locator('#amount').fill('11500');
    await page.locator('#calculateSingle').click();
    const result = page.locator('#singleResult');
    await expect(result).toContainText('10,000.00');
    await expect(result).toContainText('1,500.00');
    release();
    if (outcome === 'unavailable') await expect(page.locator('#pageStatus')).toContainText('unavailable');
    else await expect(page.locator('#country option').nth(1)).toBeAttached();
    await expect(page.locator('#modeExtract')).toHaveAttribute('aria-pressed', 'true');
    await expect(result).toContainText('1,500.00');
  });
}
