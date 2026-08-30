const { test, expect } = require('@playwright/test');

for (const width of [390, 768, 1280]) {
  test(`blog pagination remains reachable without overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/blog/');
    await page.evaluate(() => document.fonts.ready);
    const buttons = page.locator('#pageNumbers .page-num');
    const totalPages = await buttons.count();
    expect(totalPages).toBeGreaterThanOrEqual(27);
    const geometry = () => page.evaluate(() => ({
      pageWidth: document.documentElement.scrollWidth,
      viewport: document.documentElement.clientWidth,
      buttons: [...document.querySelectorAll('#pageNumbers .page-num')].map(button => {
        const rect = button.getBoundingClientRect();
        return {left: rect.left, right: rect.right};
      })
    }));
    for (const target of [totalPages, 1]) {
      const button = buttons.filter({ hasText: new RegExp(`^${target}$`) });
      await button.focus();
      await button.press('Enter');
      await expect(page.locator('.page-num[aria-current="page"]')).toHaveText(String(target));
      const dimensions = await geometry();
      expect(dimensions.pageWidth).toBeLessThanOrEqual(dimensions.viewport);
      for (const bounds of dimensions.buttons) {
        expect(bounds.left).toBeGreaterThanOrEqual(0);
        expect(bounds.right).toBeLessThanOrEqual(dimensions.viewport);
      }
      await expect(page.locator('.article-card:visible').first()).toBeVisible();
    }
    await expect(page.locator('#pagePrev')).toBeDisabled();
    await page.locator('#pageNext').click();
    await expect(page.locator('.page-num[aria-current="page"]')).toHaveText('2');
    await page.locator('#pagePrev').click();
    await expect(page.locator('.page-num[aria-current="page"]')).toHaveText('1');
    expect(errors).toEqual([]);
  });
}
