const { test, expect } = require('@playwright/test');

test.use({ viewport: { width: 375, height: 812 }, reducedMotion: 'reduce' });

for (const route of ['/uganda/ug-paye', '/fr/uganda/ug-paye']) {
  test(`${route} finds the earliest whole gross across LST jumps`, async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(route);
    await page.locator('[data-tog="lst"]').click();
    await page.locator('.mode-toggle .mode-btn').nth(1).click();

    for (const [target, expectedGross] of [[95000, 100000], [185000, 200000]]) {
      await page.locator('#grossSalary').fill(String(target));
      await page.locator('.calc-btn').click();
      await expect.poll(() => page.evaluate(() => RESULT.gross)).toBe(expectedGross);
      const result = await page.evaluate(() => ({ net: RESULT.netMonthly, input: Number(document.getElementById('grossSalary').value) }));
      expect(result.net).toBeGreaterThanOrEqual(target);
      expect(result.input).toBe(target);
    }
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBeTruthy();
    expect(errors).toEqual([]);
  });
}
