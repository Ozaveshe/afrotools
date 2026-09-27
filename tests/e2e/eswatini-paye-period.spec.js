const { test, expect } = require('@playwright/test');

test('Eswatini PAYE keeps annual and monthly results aligned in both calculation modes', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/**', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.Chart = class { destroy() {} };'
  }));
  await page.goto('/eswatini/sz-paye');

  const label = page.locator('.res-hero-label');
  const amount = page.locator('#resAmount');
  const summary = page.locator('#resGross');
  await page.locator('#grossSalary').fill('600000');
  await page.locator('.calc-btn').click();
  await expect(label).toHaveText('Annual Take-Home Pay');
  await expect(amount).toContainText('426,971');
  const annual = await page.evaluate(() => ({ gross: RESULT.gross, net: RESULT.netAnnual }));
  expect(annual).toEqual({ gross: 600000, net: 426971.4 });

  await page.locator('.per-btn').nth(1).click();
  await expect(label).toHaveText('Monthly Take-Home Pay');
  await expect(amount).toContainText('35,581');
  await page.locator('.calc-btn').click();
  await expect(amount).toContainText('35,581');
  expect(await page.evaluate(() => window.PERIOD)).toBe('monthly');

  await page.locator('.mode-btn').nth(1).click();
  await expect(page.locator('#grossSalary')).toHaveAttribute('aria-label', 'Desired annual take-home pay');
  await page.locator('#grossSalary').fill('426971');
  await page.locator('.per-btn').first().click();
  await page.locator('.calc-btn').click();
  await expect(label).toHaveText('Required Annual Gross');
  const required = await page.evaluate(() => ({ gross: RESULT.gross, net: RESULT.netAnnual }));
  expect(Math.abs(required.gross - annual.gross)).toBeLessThan(2);
  expect(required.net).toBeGreaterThanOrEqual(426971);
  expect(required.net - 426971).toBeLessThan(1);
  await expect(summary).toContainText('Take-home: E\u00a0426,971/year');

  await page.locator('.per-btn').nth(1).click();
  await expect(label).toHaveText('Required Monthly Gross');
  await expect(amount).toContainText('50,000');
  await expect(summary).toContainText('Take-home: E\u00a035,581/month');
  await page.locator('.calc-btn').click();
  await expect(amount).toContainText('50,000');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});

test('Swahili Eswatini PAYE keeps localized annual and monthly results aligned', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.setViewportSize({ width: 390, height: 844 });
  await page.route('https://cdnjs.cloudflare.com/ajax/libs/Chart.js/**', route => route.fulfill({
    contentType: 'application/javascript',
    body: 'window.Chart = class { destroy() {} };'
  }));
  await page.goto('/sw/eswatini/kikokotoo-kodi-mshahara/');

  const label = page.locator('.res-hero-label');
  const amount = page.locator('#resKiasi');
  const rows = page.locator('#resContent');
  await page.locator('#grossSalary').fill('600000');
  await page.locator('.calc-btn').click();
  await expect(label).toHaveText('Mshahara Halisi wa Mwaka');
  await expect(amount).toContainText('426,971');
  const annual = await page.evaluate(() => ({ gross: RESULT.gross, net: RESULT.netAnnual }));
  expect(annual).toEqual({ gross: 600000, net: 426971.4 });

  await page.locator('.per-btn').nth(1).click();
  await expect(label).toHaveText('Mshahara Halisi wa Mwezi');
  await expect(amount).toContainText('35,581');
  await expect(rows).not.toContainText(/NaN|undefined|Infinity/);
  await page.locator('.calc-btn').click();
  await expect(amount).toContainText('35,581');
  expect(await page.evaluate(() => window.PERIOD)).toBe('monthly');

  await page.locator('.mode-btn').nth(1).click();
  await expect(page.locator('#grossSalary')).toHaveAttribute('aria-label', 'Mshahara Halisi wa Mwaka Unaolengwa');
  await page.locator('#grossSalary').fill('426971');
  await page.locator('.per-btn').first().click();
  await page.locator('.calc-btn').click();
  await expect(label).toHaveText('Mshahara Ghafi wa Mwaka Unaohitajika');
  const required = await page.evaluate(() => ({ gross: RESULT.gross, net: RESULT.netAnnual }));
  expect(Math.abs(required.gross - annual.gross)).toBeLessThan(2);
  expect(required.net).toBeGreaterThanOrEqual(426971);
  expect(required.net - 426971).toBeLessThan(1);
  await expect(rows).not.toContainText(/NaN|undefined|Infinity/);

  await page.locator('.per-btn').nth(1).click();
  await expect(label).toHaveText('Mshahara Ghafi wa Mwezi Unaohitajika');
  await expect(amount).toContainText('50,000');
  await page.locator('.calc-btn').click();
  await expect(amount).toContainText('50,000');
  await page.evaluate(() => { document.documentElement.dataset.theme = 'dark'; });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(errors).toEqual([]);
});
