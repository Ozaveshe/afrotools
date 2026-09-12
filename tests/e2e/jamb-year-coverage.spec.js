const { test, expect } = require('@playwright/test');
const { bank, questions, reviewed } = require('../support/jamb-reviewed-fixtures');

function fixture() {
  const { review, ...base } = questions()[0];
  return bank([
    reviewed({ ...base, id: 'math-seven', num: 7, year: 2027 }),
    reviewed({ ...base, id: 'bio-one', num: 1, year: 2018, subject: 'biology' }),
    reviewed({ ...base, id: 'math-two', num: 2, year: 2027 }),
    reviewed({ ...base, id: 'math-old', num: 4, year: 1993 })
  ]);
}

for (const width of [320, 390, 1440]) test(`year availability, counts and paper order follow reviewed content at ${width}px`, async ({ page }) => {
  const data = fixture();
  await page.setViewportSize({ width, height: 900 });
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({ json: route.request().url().endsWith('/index.json') ? data.index : data.pool }));
  await page.goto('/jamb/past-questions/?subject=mathematics&year=2027');
  const year = page.getByLabel('Year', { exact: true });
  await expect(year).toBeEnabled();
  await expect(year).toHaveValue('2027');
  await expect(year.locator('option')).toHaveText(['All available years', '2027 (2 questions)', '1993 (1 question)']);
  await expect(page.locator('.qcard')).toHaveCount(2);
  await expect(page.locator('.qcard .qcard-meta .meta-chip:last-child')).toHaveText(['Q2', 'Q7']);
  await expect(page.locator('#year-coverage')).toContainText('2 questions from 2027');
  await expect(page.locator('#year-coverage')).toContainText('Full-paper coverage has not been confirmed');

  await page.getByLabel('Subject', { exact: true }).selectOption('biology');
  await expect(year.locator('option')).toHaveText(['All available years', '2018 (1 question)']);
  await expect(year).toHaveValue('');
  await expect(page.locator('#year-coverage')).toContainText('2027 is unavailable for this subject');
  await expect(page.locator('.qcard')).toHaveCount(1);

  await page.getByLabel('Subject', { exact: true }).selectOption('government');
  await expect(year).toBeDisabled();
  await expect(year.locator('option')).toHaveText(['All available years']);
  await expect(page.locator('.qcard')).toHaveCount(0);
  await expect(page.locator('#year-coverage')).toHaveText('No reviewed questions are available for this subject yet.');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(true);
});

test('a missing deep-linked year clearly falls back to available questions', async ({ page }) => {
  const data = fixture();
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({ json: route.request().url().endsWith('/index.json') ? data.index : data.pool }));
  await page.goto('/jamb/past-questions/?subject=mathematics&year=1980');
  await expect(page.getByLabel('Year', { exact: true })).toBeEnabled();
  await expect(page.getByLabel('Year', { exact: true })).toHaveValue('');
  await expect(page.locator('#year-coverage')).toContainText('1980 is unavailable');
  await expect(page.locator('.qcard')).toHaveCount(3);
});

test('actual reviewed Mathematics years and counts match the current bank', async ({ page }) => {
  const rows = require('../../data/jamb/pools/practice-pool.json').questions.filter(q => q.subject === 'mathematics');
  const counts = new Map();
  rows.forEach(q => counts.set(q.year, (counts.get(q.year) || 0) + 1));
  const latest = Math.max(...counts.keys());
  await page.goto('/jamb/past-questions/?subject=mathematics&year=' + latest);
  const year = page.getByLabel('Year', { exact: true });
  await expect(year).toBeEnabled({ timeout: 15000 });
  await expect(year).toHaveValue(String(latest));
  expect(await year.locator('option').evaluateAll(options => options.slice(1).map(o => Number(o.value))))
    .toEqual([...counts.keys()].sort((a,b) => b-a));
  await expect(page.locator('#year-coverage')).toContainText('Practice selection: ' + counts.get(latest) + ' questions from ' + latest);
  const numbers = rows.filter(q => q.year === latest).map(q => q.num).sort((a,b) => a-b).slice(0,20);
  await expect(page.locator('.qcard .qcard-meta .meta-chip:last-child')).toHaveText(numbers.map(n => 'Q' + n));
});
