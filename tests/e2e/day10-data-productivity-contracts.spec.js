const fs = require('fs');
const { test, expect } = require('@playwright/test');

const TEST_ORIGIN = process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:4173';

test.describe.configure({ mode: 'serial' });

async function openTool(page, route) {
  await page.route('**/*', async (requestRoute) => {
    const url = new URL(requestRoute.request().url());
    if (url.origin === TEST_ORIGIN) return requestRoute.continue();
    return requestRoute.abort();
  });
  await page.goto(route, { waitUntil: 'domcontentloaded' });
}

async function readDownload(download) {
  const file = await download.path();
  return fs.readFileSync(file, 'utf8');
}

test('Pomodoro starts, pauses, and resets the configured deterministic session', async ({ page }) => {
  await openTool(page, '/tools/pomodoro/');
  await page.locator('#taskInput').fill('Synthetic focus block');
  await page.locator('#workDuration').fill('15');
  await page.locator('#workDuration').dispatchEvent('change');
  await expect(page.locator('#circleTime')).toHaveText('15:00');
  await page.locator('#startBtn').click();
  await expect(page.locator('#startBtn')).toHaveText('Pause');
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('#circleTime')).toHaveText('15:00');
  await expect(page.locator('#startBtn')).toHaveText('Start');
});

test('Unit converter independently proves metres-to-feet and clears stale output', async ({ page }) => {
  await openTool(page, '/tools/unit-converter/');
  await page.locator('#lenFrom').fill('100');
  await page.locator('#lenFrom').dispatchEvent('input');
  await expect(page.locator('#lenTo')).toHaveValue('328.08399');
  await page.locator('#lenFrom').fill('');
  await page.locator('#lenFrom').dispatchEvent('input');
  await expect(page.locator('#lenTo')).toHaveValue('');
});

test('Budget planner totals entered values and reset clears persisted fixture data', async ({ page }) => {
  await openTool(page, '/tools/budget-planner/');
  await page.locator('.inc-amt').first().fill('1000');
  await page.locator('.exp-amt').first().fill('400');
  await page.getByRole('button', { name: 'Calculate Budget' }).click();
  await expect(page.locator('#sIncome')).toContainText('1,000');
  await expect(page.locator('#sExpenses')).toContainText('400');
  await expect(page.locator('#sSavings')).toContainText('600');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('button', { name: 'Reset' }).click();
  await expect(page.locator('.inc-amt').first()).toHaveValue('');
  const storage = await page.evaluate(() => JSON.stringify(localStorage));
  expect(storage).not.toContain('"1000"');
});

test('Countdown calculates a fixed 25-hour target and rejects an empty date', async ({ page }) => {
  await page.clock.install({ time: new Date(2026, 6, 27, 0, 0, 0) });
  await openTool(page, '/tools/countdown-timer/');
  const target = await page.evaluate(() => {
    const date = new Date(Date.now() + 25 * 60 * 60 * 1000);
    const pad = (value) => String(value).padStart(2, '0');
    return {
      date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    };
  });
  await page.locator('#eventName').fill('Synthetic launch');
  await page.locator('#eventDate').fill(target.date);
  await page.locator('#eventTime').fill(target.time);
  await page.getByRole('button', { name: 'Start Countdown' }).click();
  await expect(page.locator('#cdDays')).toHaveText('1');
  await page.locator('#eventDate').fill('');
  await page.getByRole('button', { name: 'Start Countdown' }).click();
  await expect(page.locator('#cdDisplay')).toBeHidden();
});

test('Time-zone converter applies the Lagos-to-Nairobi two-hour offset', async ({ page }) => {
  await openTool(page, '/tools/time-zone/');
  await page.locator('#fromTz').selectOption('Africa/Lagos');
  await page.locator('#toTz').selectOption('Africa/Nairobi');
  await page.locator('#fromTime').fill('2026-01-15T12:00');
  await page.locator('#fromTime').dispatchEvent('change');
  await expect(page.locator('#fromDisplay')).toHaveText('12:00 PM');
  await expect(page.locator('#toDisplay')).toHaveText('02:00 PM');
});

test('Public-holiday worksheet exports a parser-valid user-confirmed Nigeria entry', async ({ page }) => {
  await openTool(page, '/tools/public-holidays/');
  await page.locator('#holiday-country').selectOption('NG');
  await page.locator('#holiday-name').fill('Synthetic Civic Day');
  await page.locator('#holiday-date').fill('2026-09-14');
  await page.getByRole('button', { name: 'Prepare calendar entry' }).click();
  await expect(page.getByRole('status')).toContainText('Confirm that you checked');
  await page.locator('#holiday-confirmed').check();
  await page.getByRole('button', { name: 'Prepare calendar entry' }).click();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download ICS' }).click();
  const ics = await readDownload(await downloadPromise);
  expect(ics).toMatch(/^BEGIN:VCALENDAR\r?\n/);
  expect(ics).toContain('DTSTART;VALUE=DATE:20260914');
  expect(ics).toContain('DTEND;VALUE=DATE:20260915');
  expect(ics).toContain('SUMMARY:Synthetic Civic Day');
  expect(ics).toContain('X-AFROTOOLS-BOUNDARY:User-confirmed entry; not an official calendar');
  expect(ics.trimEnd()).toMatch(/END:VCALENDAR$/);
  expect((ics.match(/BEGIN:VEVENT/g) || []).length).toBe(1);
});

test('Working-days calculator proves an inclusive Monday-to-Friday interval', async ({ page }) => {
  await openTool(page, '/tools/working-days/');
  await page.locator('#startDate').fill('2026-01-05');
  await page.locator('#endDate').fill('2026-01-09');
  await page.locator('#country').selectOption('ng');
  await page.getByRole('button', { name: 'Calculate', exact: true }).click();
  await expect(page.locator('#workDays')).toHaveText('5');
  await expect(page.locator('#calDays')).toHaveText('5');
  await page.locator('#endDate').fill('2026-01-01');
  await page.getByRole('button', { name: 'Calculate', exact: true }).click();
  await expect(page.locator('#results')).toBeHidden();
});

test('Age calculator proves an exact anniversary and clears stale invalid output', async ({ page }) => {
  await openTool(page, '/tools/age-calculator/');
  await page.locator('#dob').fill('2000-01-15');
  await page.locator('#atDate').fill('2025-01-15');
  await page.getByRole('button', { name: 'Calculate Age' }).click();
  await expect(page.locator('#rYears')).toHaveText('25');
  await expect(page.locator('#rMonths')).toHaveText('0');
  await expect(page.locator('#rDays')).toHaveText('0');
  await page.locator('#dob').fill('');
  await page.getByRole('button', { name: 'Calculate Age' }).click();
  await expect(page.locator('#results')).toBeHidden();
});

test('Grade tracker proves weighted arithmetic, escapes labels, and reopens JSON export', async ({ page }) => {
  await openTool(page, '/tools/grade-tracker/');
  const firstCourse = page.locator('.course-row').first();
  await firstCourse.locator('input').first().fill('<img src=x onerror=window.__day10Injected=1>');
  await page.getByRole('button', { name: 'Calculate GPA' }).click();
  await expect(page.locator('#summaryCards')).toContainText('85.00');
  expect(await page.evaluate(() => window.__day10Injected || 0)).toBe(0);
  expect(await page.locator('#breakdownTable img').count()).toBe(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download JSON' }).click();
  const exported = JSON.parse(await readDownload(await downloadPromise));
  expect(exported.gpa).toBe(85);
  expect(exported.courses[0].name).toContain('<img');
});

test('Random picker is deterministic under a stubbed crypto source and does not interpret HTML', async ({ page }) => {
  await page.addInitScript(() => {
    Object.defineProperty(globalThis.crypto, 'getRandomValues', {
      configurable: true,
      value(array) {
        array.fill(0);
        return array;
      },
    });
  });
  await openTool(page, '/tools/random-picker/');
  await page.locator('#nameList').fill('<img src=x onerror=window.__day10Injected=1>\nBeta');
  await page.locator('#pickCount').fill('1');
  await page.locator('#namePickBtn').click();
  await expect(page.locator('#resultText')).toContainText('<img');
  expect(await page.evaluate(() => window.__day10Injected || 0)).toBe(0);
  expect(await page.locator('#resultDisplay img').count()).toBe(0);
  await page.locator('.hist-clear').click();
  await expect(page.locator('#historySection')).toBeHidden();
});

test('Meeting-cost formula independently proves hourly, per-minute, and annual values', async ({ page }) => {
  await openTool(page, '/tools/meeting-cost/');
  await page.locator('#attendees').fill('6');
  await page.locator('#salary').fill('60000');
  await page.locator('#duration').fill('60');
  await page.locator('#overhead').selectOption('1.3');
  await page.locator('#frequency').selectOption('52');
  await page.locator('#workHours').fill('2080');
  await page.locator('#workHours').dispatchEvent('input');
  await expect(page.locator('#meetingCost')).toHaveText('$225');
  await expect(page.locator('#perMinute')).toHaveText('$4');
  await expect(page.locator('#annualCost')).toHaveText('$11,700');
});

test('Tip calculator proves tax, tip, split arithmetic and zero-state reset', async ({ page }) => {
  await openTool(page, '/tools/tip-calculator/');
  await page.locator('#billAmt').fill('1000');
  await page.locator('#taxPct').fill('10');
  await page.locator('#tipPct').fill('20');
  await page.locator('#splitNum').fill('2');
  await page.locator('#splitNum').dispatchEvent('input');
  await expect(page.locator('#billPlusTax')).toHaveText('₦1,100');
  await expect(page.locator('#tipAmount')).toHaveText('₦200');
  await expect(page.locator('#totalWithTip')).toHaveText('₦1,300');
  await expect(page.locator('#perPerson')).toHaveText('₦650');
  await expect(page.locator('#tipPerPerson')).toHaveText('₦100');
  await page.locator('#billAmt').fill('');
  await page.locator('#billAmt').dispatchEvent('input');
  await expect(page.locator('#totalWithTip')).toHaveText('₦0');
});
