const { test, expect } = require('@playwright/test');

test('feddan landing page converts both ways and fits mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/tools/unit-converter/feddan-to-acre/');
  await page.getByRole('button', { name: 'Calculate area' }).click();
  await expect(page.locator('#acresResult')).toHaveText('1.037843');
  await page.locator('#direction').selectOption('acre-to-feddan');
  await expect(page.getByLabel('Area in acres')).toBeVisible();
  await page.locator('#amount').fill('1');
  await page.getByRole('button', { name: 'Calculate area' }).click();
  await expect(page.locator('#squareMetresResult')).toHaveText('4,046.856422');
  await page.locator('#basis').fill('0');
  await page.getByRole('button', { name: 'Calculate area' }).click();
  await expect(page.locator('#areaResult')).toBeHidden();
  await expect(page.locator('#areaStatus')).toContainText('positive feddan area');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/tools/unit-converter/feddan-to-acre/');
});
