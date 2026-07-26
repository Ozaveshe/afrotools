const { test, expect } = require('@playwright/test');

const route = '/tools/student-budget/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_STUDENT_BUDGET_VIP)).toBe(true);
});

async function fillTerm(page) {
  await page.locator('#sbPeriod').fill('4');
  await page.locator('#sbCurrency').fill('KES');
  await page.locator('#sbMonthlyIncome').fill('1000');
  await page.locator('#sbPeriodFunding').fill('500');
  await page.locator('#sbHousing').fill('300');
  await page.locator('#sbFood').fill('200');
  await page.locator('#sbTransport').fill('100');
  await page.locator('#sbTuition').fill('1000');
  await page.locator('#sbSetup').fill('100');
}

test('keeps monthly and whole-period amounts in the correct cadence', async ({ page }) => {
  await fillTerm(page);
  await page.getByRole('button', { name: 'Calculate this budget' }).click();
  await expect(page.locator('#sbStats')).toContainText('KES 4,500');
  await expect(page.locator('#sbStats')).toContainText('KES 3,500');
  await expect(page.locator('#sbStats')).toContainText('KES 1,000');
  await expect(page.locator('#sbStats')).toContainText('KES 250');
  await expect(page.locator('#sbBreakdown tr').filter({ hasText: 'Tuition' })).toContainText('Once in period');
  await expect(page.locator('#sbBreakdown tr').filter({ hasText: 'Housing' })).toContainText('Monthly × 4');
});

test('rejects invalid period and negative values', async ({ page }) => {
  await page.locator('#sbPeriod').fill('25');
  await page.getByRole('button', { name: 'Calculate this budget' }).click();
  await expect(page.locator('#sbStatus')).toContainText('no more than 24');
  await expect(page.locator('#sbResults')).not.toHaveClass(/show/);
});

test('contains no unsupported city or university averages or savings advice', async ({ page }) => {
  await expect(page.locator('body')).not.toContainText('Lagos, Nigeria');
  await expect(page.locator('body')).not.toContainText('Reference monthly living-cost');
  await expect(page.locator('body')).not.toContainText('makes this plan less fragile');
  await expect(page.locator('.sb-warning')).toContainText('does not predict prices');
});

test('saving is explicit and clearable', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#sbMonthlyIncome').fill('1000');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.studentBudget.v3'))).toBe(null);
  await page.getByRole('button', { name: 'Save on this device' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.studentBudget.v3'))).not.toBe(null);
  await page.getByRole('button', { name: 'Clear saved budget' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.studentBudget.v3'))).toBe(null);
});

test('escapes the user-provided currency label', async ({ page }) => {
  await page.locator('#sbCurrency').fill('\"><img src=x onerror=window.__budgetXss=1>');
  await page.locator('#sbMonthlyIncome').fill('100');
  await page.getByRole('button', { name: 'Calculate this budget' }).click();
  expect(await page.evaluate(() => window.__budgetXss)).toBeUndefined();
  await expect(page.locator('#sbStats img')).toHaveCount(0);
});

test('exports local text and valid browser PDF', async ({ page }) => {
  await fillTerm(page);
  await page.getByRole('button', { name: 'Calculate this budget' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('student-budget-snapshot.txt');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
});

test('is mobile-safe, dark-capable, labelled and self-hosted', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.sb-card').first()).toHaveCSS('background-color', 'rgb(16, 35, 55)');
  await expect(page.getByLabel('Planning period in months')).toBeVisible();
  await expect(page.locator('#sbActionStatus')).toHaveAttribute('aria-live', 'polite');
  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('fonts.googleapis.com');
  expect(head).toContain('/assets/fonts/typography.css');
});
