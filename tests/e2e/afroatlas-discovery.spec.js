const { test, expect } = require('@playwright/test');

test('Atlas country directory and country answers remain usable without JavaScript', async ({ browser }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173'
  });
  const page = await context.newPage();
  await page.goto('/tools/afroatlas/');
  const countryLinks = page.locator('#aa-grid a[href^="/tools/afroatlas/country/"]');
  await expect(countryLinks).toHaveCount(54);
  await page.goto('/tools/afroatlas/country/nigeria/');
  await expect(page.getByRole('heading', { name: 'Nigeria economy and natural resources' })).toBeVisible();
  await expect(page.getByRole('link', { name: /Compare Nigeria with/ })).toHaveAttribute('href', /compare\?a=NG/);
  await expect(page.getByRole('heading', { name: 'Questions about Nigeria' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

test('Atlas profile comparison works at mobile width', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/afroatlas/country/nigeria/');
  await page.locator('#aa-cmp-select').selectOption('KE');
  await page.locator('#aa-cmp-btn').click();
  await expect(page).toHaveURL(/\/compare\?.*(?:a|countryA)=NG/);
  await expect(page.getByRole('heading', { name: /Nigeria vs Kenya/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});
