const { test, expect } = require('@playwright/test');

const route = '/tools/kcse-calculator/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_KCSE_VIP)).toBe(true);
});

async function loadForcedMathCase(page) {
  await page.locator('#kcMath').selectOption('E');
  await page.locator('#kcEnglish').selectOption('A');
  await page.locator('#kcKiswahili').selectOption('E');
  const selects = page.locator('[id^="kcOtherGrade"]');
  for (let i = 0; i < 7; i++) await selects.nth(i).selectOption('A');
}

test('uses mandatory Mathematics instead of generic best seven', async ({ page }) => {
  await loadForcedMathCase(page);
  await page.getByRole('button', { name: 'Calculate mean grade' }).click();
  await expect(page.locator('#kcSummary')).toContainText('B+');
  await expect(page.locator('#kcSummary')).toContainText('73 / 84');
  await expect(page.locator('#kcBreakdown tr').filter({ hasText: 'Mathematics' })).toContainText('Mandatory Mathematics');
  await expect(page.locator('#kcBreakdown tr').filter({ hasText: 'Mathematics' })).toContainText('Yes');
});

test('rejects an incomplete regular-candidate estimate', async ({ page }) => {
  await page.locator('#kcMath').selectOption('A');
  await page.locator('#kcEnglish').selectOption('A');
  await page.getByRole('button', { name: 'Calculate mean grade' }).click();
  await expect(page.locator('#kcStatus')).toContainText('five additional graded subjects');
  await expect(page.locator('#kcResults')).not.toHaveClass(/show/);
});

test('contains no invented cluster or course eligibility result', async ({ page }) => {
  await page.getByRole('button', { name: 'Load synthetic sample' }).click();
  await page.getByRole('button', { name: 'Calculate mean grade' }).click();
  await expect(page.locator('body')).not.toContainText('Qualifies for all university programmes');
  await expect(page.locator('body')).not.toContainText('KUCCPS eligible');
  await expect(page.locator('.kc-warning')).toContainText('No cluster or eligibility score');
  await expect(page.getByRole('link', { name: 'Open KUCCPS student portal' })).toHaveAttribute('href', 'https://students.kuccps.net/');
});

test('saving is explicit and clearable', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#kcMath').selectOption('A');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.kcse.grades.v2'))).toBe(null);
  await page.getByRole('button', { name: 'Save grades on this device' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.kcse.grades.v2'))).not.toBe(null);
  await page.getByRole('button', { name: 'Clear saved grades' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.kcse.grades.v2'))).toBe(null);
});

test('exports local text and valid browser PDF', async ({ page }) => {
  await page.getByRole('button', { name: 'Load synthetic sample' }).click();
  await page.getByRole('button', { name: 'Calculate mean grade' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('kcse-mean-grade-estimate.txt');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
});

test('escapes editable subject names', async ({ page }) => {
  const payload = '\"><img src=x onerror=window.__kcseXss=1>';
  await page.getByRole('button', { name: 'Load synthetic sample' }).click();
  await page.locator('#kcOtherName0').fill(payload);
  await page.getByRole('button', { name: 'Calculate mean grade' }).click();
  expect(await page.evaluate(() => window.__kcseXss)).toBeUndefined();
  await expect(page.locator('#kcBreakdown img')).toHaveCount(0);
});

test('is mobile-safe, dark-capable, labelled and self-hosted', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.kc-card').first()).toHaveCSS('background-color', 'rgb(16, 35, 55)');
  await expect(page.getByLabel('Mathematics *')).toBeVisible();
  await expect(page.locator('#kcActionStatus')).toHaveAttribute('aria-live', 'polite');
  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('fonts.googleapis.com');
  expect(head).toContain('/assets/fonts/typography.css');
});
