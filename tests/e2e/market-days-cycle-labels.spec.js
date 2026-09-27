const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  test(`Market Days keeps cycle names readable at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/tools/market-days/?date=2026-01-01', { waitUntil: 'domcontentloaded' });
    await expect(page.locator('.cycle-item')).toHaveCount(4);

    async function expectReadableCycle() {
      const layout = await page.locator('.cycle-item').evaluateAll(items => items.map(item => {
        const name = item.querySelector('.cycle-item-name');
        const alias = item.querySelector('.cycle-item-alias');
        return {
          itemWidth: item.clientWidth,
          nameHeight: name.getBoundingClientRect().height,
          aliasHeight: alias.getBoundingClientRect().height,
          pageWidth: document.documentElement.scrollWidth,
          viewportWidth: window.innerWidth
        };
      }));
      for (const item of layout) {
        expect(item.itemWidth).toBeGreaterThan(180);
        expect(item.nameHeight).toBeLessThan(32);
        expect(item.aliasHeight).toBeLessThan(32);
        expect(item.pageWidth).toBeLessThanOrEqual(item.viewportWidth + 1);
      }
    }

    await expectReadableCycle();
    await page.getByRole('button', { name: 'Open menu' }).click();
    await page.getByRole('button', { name: 'Switch to dark mode' }).click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expectReadableCycle();
    expect(errors).toEqual([]);
  });
}
