const { test, expect } = require('@playwright/test');

const route = '/tools/teacher-salary/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_TEACHER_SALARY_VIP)).toBe(true);
});

test('calculates only from the entered offer', async ({ page }) => {
  await page.locator('#tsBase').fill('100000');
  await page.locator('#tsAllowances').fill('20000');
  await page.locator('#tsDeductions').fill('15000');
  await page.locator('#tsHours').fill('40');
  await page.locator('#tsWeeks').fill('48');
  await page.getByRole('button', { name: 'Check this offer' }).click();
  await expect(page.locator('#tsStats')).toContainText('NGN 120,000');
  await expect(page.locator('#tsStats')).toContainText('NGN 105,000');
  await expect(page.locator('#tsStats')).toContainText('NGN 1,440,000');
  await expect(page.locator('#tsStats')).toContainText('NGN 750');
});

test('rejects impossible deductions and provides no guessed result', async ({ page }) => {
  await page.locator('#tsBase').fill('1000');
  await page.locator('#tsDeductions').fill('2000');
  await page.getByRole('button', { name: 'Check this offer' }).click();
  await expect(page.locator('#tsFormStatus')).toContainText('cannot exceed');
  await expect(page.locator('#tsResults')).not.toHaveClass(/show/);
});

test('country routes change the scoped official source without salary claims', async ({ page }) => {
  await page.locator('#tsCountry').selectOption('kenya');
  await expect(page.locator('#tsSourceName')).toContainText('Teachers Service Commission');
  await expect(page.locator('#tsSourceLink')).toHaveAttribute('href', 'https://www.tsc.go.ke/');
  await expect(page.locator('body')).not.toContainText('KSh 20,000');
  await expect(page.locator('body')).not.toContainText('Premium private');
});

test('saving is explicit and clearable', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.locator('#tsBase').fill('80000');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.teacherSalary.offer.v2'))).toBe(null);
  await page.getByRole('button', { name: 'Save on this device' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.teacherSalary.offer.v2'))).not.toBe(null);
  await page.getByRole('button', { name: 'Clear saved offer' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('afrotools.teacherSalary.offer.v2'))).toBe(null);
});

test('downloads local TXT and produces valid print PDF', async ({ page }) => {
  await page.locator('#tsBase').fill('100000');
  await page.getByRole('button', { name: 'Check this offer' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('teacher-salary-offer-brief.txt');
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
});

test('is mobile-safe, dark-capable and self-hosted', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.ts-card').first()).toHaveCSS('background-color', 'rgb(14, 32, 51)');
  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('fonts.googleapis.com');
  expect(head).toContain('/assets/fonts/typography.css');
});

test('has labelled controls and no runtime errors', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.reload();
  await expect(page.getByLabel('Gross base salary per month')).toBeVisible();
  await expect(page.getByLabel('Expected hours per week')).toBeVisible();
  await expect(page.locator('#tsActionStatus')).toHaveAttribute('aria-live', 'polite');
  expect(errors).toEqual([]);
});
