const { test, expect } = require('@playwright/test');

test.describe('Swahili Kenya CGT', () => {
  test('calculates, rejects invalid scope and reopens TXT locally', async ({ page }) => {
    const egress = [];
    page.on('request', request => { if (!request.url().startsWith('http://127.0.0.1:4173/')) egress.push(request.url()); });
    await page.goto('/sw/zana/kikokotoo-cgt-kenya/');
    await page.getByRole('button', { name: 'Kokotoa CGT' }).click();
    await expect(page.locator('[data-error]')).toContainText('Thibitisha upeo');
    await page.locator('[name="scopeConfirmed"]').check();
    await page.getByRole('button', { name: 'Kokotoa CGT' }).click();
    await expect(page.locator('[data-tax]')).toContainText('900,000');
    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Pakua TXT' }).click();
    const download = await downloadPromise;
    const text = require('fs').readFileSync(await download.path(), 'utf8');
    expect(text).toContain('Makadirio ya CGT ya Kenya');
    expect(text).toContain('Ksh');
    expect(egress.filter(url => /900000|15000000|8700000/.test(url))).toEqual([]);
  });

  for (const width of [320, 375]) test(`reflows at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/sw/zana/kikokotoo-cgt-kenya/');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
  });

  test('supports 200% reflow, themes, keyboard and reciprocal metadata', async ({ page }) => {
    await page.setViewportSize({ width: 640, height: 900 });
    await page.goto('/sw/zana/kikokotoo-cgt-kenya/');
    await page.evaluate(() => { document.documentElement.style.zoom = '2'; document.documentElement.dataset.theme = 'dark'; });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    await page.keyboard.press('Tab');
    await expect(page.locator('.ke-skip')).toBeFocused();
    await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/sw/zana/kikokotoo-cgt-kenya/');
    await expect(page.locator('link[hreflang="en"]')).toHaveAttribute('href', 'https://afrotools.com/tools/ke-cgt/');
    await expect(page.locator('link[hreflang="fr"]')).toHaveAttribute('href', 'https://afrotools.com/fr/tools/ke-plus-value/');
  });
});
