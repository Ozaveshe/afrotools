const { test, expect } = require('@playwright/test');

for (const width of [320, 390]) {
  for (const colorScheme of ['light', 'dark']) {
    test(`AfroStream calendar keeps seven days visible at ${width}px in ${colorScheme} mode`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.emulateMedia({ colorScheme });
      await page.goto('/tools/afrostream/calendar.html');

      const monthHeaders = page.locator('.as-cal-dow');
      await expect(monthHeaders).toHaveCount(7);
      const monthPositions = await monthHeaders.evaluateAll((headers) => headers.map((header) => {
        const bounds = header.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y };
      }));
      expect(new Set(monthPositions.map((position) => position.y)).size).toBe(1);
      expect(monthPositions.every((position, index) => index === 0 || position.x > monthPositions[index - 1].x)).toBe(true);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);

      await page.getByRole('button', { name: 'Week', exact: true }).click();
      const weekHeaders = page.locator('.as-week-day-header');
      await expect(weekHeaders).toHaveCount(7);
      const weekPositions = await weekHeaders.evaluateAll((headers) => headers.map((header) => {
        const bounds = header.getBoundingClientRect();
        return { x: bounds.x, y: bounds.y };
      }));
      expect(new Set(weekPositions.map((position) => position.y)).size).toBe(1);
      expect(weekPositions.every((position, index) => index === 0 || position.x > weekPositions[index - 1].x)).toBe(true);

      const scroller = page.getByRole('region', { name: 'Weekly stream schedule' });
      await expect(scroller).toBeVisible();
      const scrollMetrics = await scroller.evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(scrollMetrics.scrollWidth).toBeGreaterThan(scrollMetrics.clientWidth);
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}
