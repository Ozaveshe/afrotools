const { test, expect } = require('@playwright/test');

const route = '/tools/study-planner/';

test.beforeEach(async ({ page }) => {
  await page.goto(route);
  await expect.poll(() => page.evaluate(() => window.AFROTOOLS_STUDY_PLANNER_VIP)).toBe(true);
});

test('uses exact capacity when subjects outnumber sessions', async ({ page }) => {
  await page.locator('#hoursPerDay').fill('1');
  await page.locator('#daysPerWeek').selectOption('5');
  await page.locator('#sessionLength').selectOption('1');
  await page.getByRole('button', { name: /Generate Timetable/ }).click();
  await expect(page.locator('#statsBar')).toContainText('5h');
  await expect(page.locator('#timetable input[type="checkbox"]')).toHaveCount(5);
  await expect(page.locator('.sp-break-pill.is-unscheduled')).toHaveCount(2);
  await expect(page.locator('.sp-capacity-warning')).toContainText('2 subjects received no session');
});

test('rejects a plan that would end after midnight', async ({ page }) => {
  await page.locator('#hoursPerDay').fill('3');
  await page.locator('#daysPerWeek').selectOption('5');
  await page.locator('#sessionLength').selectOption('1');
  await page.locator('#startTime').fill('22:30');
  await page.getByRole('button', { name: /Generate Timetable/ }).click();
  await expect(page.locator('#spGenerateStatus')).toContainText('after midnight');
  await expect(page.locator('#resultsArea')).not.toHaveClass(/show/);
});

test('preset dates stay blank and saving is explicit', async ({ page }) => {
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.getByRole('button', { name: /Tanzania CSEE/ }).click();
  await expect(page.locator('.sp-exam-date').first()).toHaveValue('');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sp_subjects'))).toBe(null);
  await page.getByRole('button', { name: 'Save on this device' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sp_subjects'))).not.toBe(null);
  await page.getByRole('button', { name: 'Clear saved plan' }).click();
  await expect.poll(() => page.evaluate(() => localStorage.getItem('sp_subjects'))).toBe(null);
});

test('renders subject input as text and downloads a local text plan', async ({ page }) => {
  const payload = '\"><img src=x onerror=window.__studyXss=1>';
  await page.locator('.sp-subject input[type="text"]').first().fill(payload);
  await page.getByRole('button', { name: /Generate Timetable/ }).click();
  expect(await page.evaluate(() => window.__studyXss)).toBeUndefined();
  await expect(page.locator('#breakdown img')).toHaveCount(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download TXT' }).first().click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('afrotools-study-plan.txt');
});

test('fits narrow mobile width and supports real dark surfaces', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.evaluate(() => document.documentElement.dataset.theme = 'dark');
  await expect(page.locator('.sp-card').first()).toHaveCSS('background-color', 'rgb(17, 31, 51)');
  const head = await page.locator('head').innerHTML();
  expect(head).not.toContain('fonts.googleapis.com');
  expect(head).toContain('/assets/fonts/typography.css');
});

test('print view produces a valid browser PDF', async ({ page }) => {
  await page.getByRole('button', { name: /Generate Timetable/ }).click();
  const pdf = await page.pdf({ format: 'A4', printBackground: true });
  expect(pdf.subarray(0, 4).toString()).toBe('%PDF');
  expect(pdf.length).toBeGreaterThan(10000);
});
