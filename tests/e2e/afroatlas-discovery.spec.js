const { test, expect } = require('@playwright/test');

test('Atlas country directory and country answers remain usable without JavaScript', async ({ browser, baseURL }) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    viewport: { width: 390, height: 844 },
    baseURL
  });
  const page = await context.newPage();
  await page.goto('/tools/afroatlas/');
  const countryLinks = page.locator('#aa-grid a[href^="/tools/afroatlas/country/"]');
  await expect(countryLinks).toHaveCount(54);
  await page.goto('/tools/afroatlas/country/nigeria/');
  await expect(page.getByRole('heading', { name: 'Nigeria economy and natural resources' })).toBeVisible();
  await expect(page.locator('.aa-country-hero').getByRole('link', { name: /Compare Nigeria with/ })).toHaveAttribute('href', /compare\?a=NG/);
  await expect(page.getByRole('heading', { name: 'Questions about Nigeria' })).toBeVisible();
  await expect(page.locator('#economy .aa-core-snapshot')).toContainText('World Bank WDI, 2025');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await context.close();
});

test('Atlas shows dated sources after enhancement and honest gaps in comparison', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/tools/afroatlas/country/eritrea/');
  await expect(page.locator('.aa-stats-row')).toContainText('N/A');
  await expect(page.locator('.aa-hero-meta').last()).toContainText('GDP unavailable (2016–2025)');
  await expect(page.locator('.aa-hero-meta').last().getByRole('link', { name: /population 2025/ })).toHaveAttribute('href', /SP\.POP\.TOTL/);
  await page.goto('/tools/afroatlas/compare?a=ER&b=NG');
  await expect(page.locator('.aa-cmp-source-note')).toContainText('Eritrea: GDP unavailable (2016–2025)');
  await expect(page.locator('.aa-cmp-source-note').getByRole('link', { name: /GDP 2025/ })).toHaveAttribute('href', /NY\.GDP\.MKTP\.CD/);
  await expect(page.locator('.aa-cmp-metric').first()).toContainText('No comparable pair');
  await expect(page.locator('.aa-cmp-metric').first()).toContainText('N/A');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
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
