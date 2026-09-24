const { test, expect } = require('@playwright/test');
const fs = require('fs');

for (const width of [390, 1440]) {
  test(`Seller preserves local stock movements and CSV exports after reload at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    const errors = [];
    const writes = [];
    page.on('pageerror', error => errors.push(error.message));
    page.on('request', request => {
      if (request.postData()) writes.push(request.method());
    });
    await page.route(/https:\/\//, route => route.fulfill({ status: 200, body: '' }));
    await page.route('**/assets/js/afro-auth.js*', route => route.fulfill({
      contentType: 'application/javascript',
      body: 'window.AfroAuth={getUser:()=>({id:"seller-fixture",tier:"pro"}),getSessionToken:()=>"synthetic-token",onReady:fn=>fn(),getSupabase:()=>null};'
    }));
    await page.route('**/api/profile', route => route.fulfill({
      json: { profile: { id: 'seller-fixture', tier: 'pro' } }
    }));
    await page.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
    await page.goto('/pro/apps/seller/');
    await expect(page.locator('html')).toHaveAttribute('data-pro-gate', 'unlocked');
    if (width >= 1120) {
      const mainWidth = await page.locator('.seller-main').evaluate(node => node.getBoundingClientRect().width);
      expect(mainWidth).toBeGreaterThan(900);
    }
    await page.locator('#businessName').fill('Synthetic Seller QA');
    await page.locator('#saveNowBtn').click();
    await page.locator('#productName').fill('Synthetic QA Basket');
    await page.locator('#productSku').fill('QA-BASKET-001');
    await page.locator('#costPrice').fill('100');
    await page.locator('#sellingPrice').fill('150');
    await page.locator('#stockOnHand').fill('5');
    await page.locator('#reorderLevel').fill('1');
    await page.locator('#productSubmitBtn').click();

    const readSaved = () => page.evaluate(() => JSON.parse(localStorage.getItem('afroseller_social_commerce_os_v1')));
    const before = await readSaved();
    expect(before.business.name).toBe('Synthetic Seller QA');
    expect(before.products).toHaveLength(1);
    expect(before.stockMovements).toHaveLength(1);
    // New opening-stock rows can have an empty variantName. Restoration must resolve
    // their product from the saved snapshot before the global state exists.
    await page.reload();
    await expect(page.locator('#businessName')).toHaveValue('Synthetic Seller QA');
    const restored = await readSaved();
    expect(restored.products).toEqual(before.products);
    expect(restored.stockMovements[0]).toMatchObject(before.stockMovements[0]);
    const pending = page.waitForEvent('download');
    await page.locator('#exportProductsBtn').click();
    const download = await pending;
    const csv = fs.readFileSync(await download.path(), 'utf8');
    expect(csv).toContain('QA-BASKET-001');
    expect(csv).toContain('Synthetic QA Basket');
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, scroll: document.documentElement.scrollWidth }));
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.viewport + 1);
    expect(errors).toEqual([]);
    expect(writes).toEqual([]);
  });
}
