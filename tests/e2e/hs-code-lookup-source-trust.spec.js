const { test, expect } = require('@playwright/test');

test('HS lookup supports search and cautious tariff comparison', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  const consoleErrors = [];
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });

  await page.goto('/tools/hs-code-lookup/');
  await expect(page).toHaveTitle(/HS Code Lookup/);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/tools/hs-code-lookup/');
  await expect(page.getByText('30 Seeded HS Chapters')).toBeVisible();
  await expect(page.getByText('24 Country Profiles')).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBeTruthy();

  await page.getByLabel('Search product name or HS code').fill('rice');
  await expect(page.locator('#acList .ac-item').first()).toBeVisible();
  await page.locator('#acList .ac-item').first().click();
  await expect(page.locator('#resultHero')).toHaveClass(/on/);
  await expect(page.locator('#dutyTableBody tr')).toHaveCount(24);
  await expect(page.getByText('Indicative Duty by Country')).toBeVisible();

  await page.getByRole('tab', { name: /Compare Countries/ }).click();
  await page.locator('#cmpCode').fill('1006.10');
  await page.getByRole('button', { name: 'Compare Countries' }).click();
  await expect(page.locator('#cmpBody tr')).toHaveCount(7);
  await expect(page.locator('#cmpAiPanel')).toContainText('not applied automatically');

  await expect(page.getByRole('link', { name: /Nigeria Customs CET portal/ })).toHaveAttribute('href', 'https://cet.customs.gov.ng/');
  expect(consoleErrors).toEqual([]);
});

test('extensionless HS lookup route resolves to the canonical page', async ({ page }) => {
  const response = await page.goto('/tools/hs-code-lookup');

  expect(response && response.ok()).toBeTruthy();
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute('href', 'https://afrotools.com/tools/hs-code-lookup/');
});
