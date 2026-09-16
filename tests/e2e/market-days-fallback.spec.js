const { test, expect } = require('@playwright/test');

test('market-day fallback does not claim a stale date when scripts are disabled', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 375, height: 812 } });
  const page = await context.newPage();
  await page.goto('/tools/market-days/');
  await expect(page.locator('main noscript p')).toBeVisible();
  await expect(page.locator('main noscript p')).toContainText('Enable JavaScript');
  await expect(page.locator('#selectedDateMeta')).not.toContainText('April 2026');
  await expect(page.locator('#nigeriaDayName')).toHaveText('Waiting for date');
  await expect(page.locator('#deviceDayName')).toHaveText('Waiting for date');
  await expect(page.locator('#monthLabel')).toHaveText('Calendar loading');
  await context.close();
});

test('market-day calculator replaces fallback with the current date and supports lookup', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.clock.install({ time: new Date('2026-01-01T12:00:00Z') });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/market-days/');
  await expect(page.locator('#nigeriaDayName')).toHaveText('Orie');
  await expect(page.locator('#selectedDayName')).toHaveText('Orie');
  await expect(page.locator('#selectedDateMeta')).toContainText('1 January 2026');
  await page.getByLabel('Pick any Gregorian date').fill('2026-01-04');
  await expect(page.locator('#selectedDayName')).toHaveText('Eke');
  await expect(page.locator('#selectedDateMeta')).toContainText('4 January 2026');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
