const { test, expect } = require('@playwright/test');
const bank = require('../../data/jamb/pools/practice-pool.json');
const { bank: fixtureBank, questions, reviewed } = require('../support/jamb-reviewed-fixtures');
test.beforeEach(async ({ context }) => {
  await context.route(url => !['127.0.0.1', 'localhost'].includes(url.hostname), route => route.abort('failed'));
  await context.addInitScript(() => localStorage.setItem('afrotools_cookie_consent', 'declined'));
});
for (const width of [320, 390]) test(`year quick practice saves, resumes and scores ten questions at ${width}px`, async ({ page }) => {
  const errors = [], posts = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => { if (request.method() === 'POST' && /jamb-attempt/.test(request.url())) posts.push(request.url()); });
  await page.setViewportSize({ width, height: 844 });
  await page.goto('/jamb/english/2022/');
  const launch = page.getByRole('link', { name: 'Start 10-question 2022 Use of English quick practice', exact: true });
  await expect(launch).toHaveAttribute('href', '/jamb/cbt/?subject=english&year=2022&mode=quick');
  await launch.click();
  await expect(page.locator('#collection-description')).toContainText('10 distinct reviewed questions');
  await expect(page.locator('#collection-description')).toContainText('30 minutes');
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible({ timeout: 60000 });
  const state = await page.evaluate(() => AfroJAMB.CBT.getState());
  expect(state).toMatchObject({ mode: 'quick', year: 2022, durationMs: 1800000 });
  expect(state.questions).toHaveLength(10);
  await expect(page.locator('#cbt-timer')).toHaveText(/^00:(?:29|30):[0-5][0-9]$/);
  expect(new Set(state.questions.map(q => q.id)).size).toBe(10);
  for (const q of state.questions) expect(q).toEqual(bank.questions.find(item => item.id === q.id));
  expect(state.questions.every(q => q.year === 2022 && q.subject === 'english')).toBe(true);
  const first = state.questions[0];
  await page.locator(`#cbt-options [aria-label^="Option ${first.answer}:"]`).click();
  await page.reload();
  await expect(page.locator('#resume-card')).toBeVisible();
  await page.locator('#resume-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible({ timeout: 60000 });
  expect(await page.evaluate(() => AfroJAMB.CBT.getCurrentQuestion().selectedAnswer)).toBe(first.answer);
  const saved = await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'));
  await page.goto('/jamb/cbt/?subject=english&year=2022');
  await expect(page.locator('#resume-conflict')).toBeVisible();
  await expect(page.locator('#resume-card')).toBeHidden();
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'))).toBe(saved);
  await page.goto('/jamb/cbt/?subject=english&year=2023&mode=quick');
  await expect(page.locator('#resume-conflict')).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem('afrojamb-cbt-state'))).toBe(saved);
  await page.goto('/jamb/cbt/?subject=english&year=2022&mode=quick');
  await page.locator('#resume-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible({ timeout: 60000 });
  await page.locator('#cbt-submit-top').click(); await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#result-aggregate')).toHaveText('1/10');
  await page.locator('.rev-filter[data-filter="all"]').click();
  await expect(page.locator('#review-list .answer-explanation')).toHaveCount(10);
  await expect(page.locator('#review-list .answer-explanation[open]')).toHaveCount(0);
  await expect(page.locator('#result-again')).toHaveAttribute('href', '/jamb/cbt/?subject=english&year=2022&mode=quick');
  expect(await page.evaluate(() => JSON.parse(localStorage.getItem('afrojamb-collection-history'))[0])).toMatchObject({ year: 2022, subject: 'english', correct: 1, graded: 10 });
  expect(await page.evaluate(() => Math.max(document.body.scrollWidth, document.documentElement.scrollWidth) - innerWidth)).toBeLessThanOrEqual(1);
  expect(errors).toEqual([]); expect(posts).toEqual([]);
});
test('invalid scoped modes fail closed and fewer than ten reviewed questions cannot be padded', async ({ page }) => {
  for (const query of ['subject=bad&year=2022', 'subject=english&year=bad', 'subject=english&year=2022&mode=bad', 'subject=english&year=2022&mode=quick&mode=quick']) {
    await page.goto('/jamb/cbt/?' + query);
    await expect(page.locator('#start-btn')).toBeDisabled();
    await expect(page.locator('#setup-warning')).toContainText('invalid');
  }
  // This negative case uses an explicitly synthetic nine-question publication;
  // positive mobile sessions above use the actual first-party source bank.
  const { review, ...base } = questions()[0];
  const fixture = fixtureBank(Array.from({ length: 9 }, (_, i) => reviewed({ ...base,
    id: 'synthetic-small-year-' + i, question: base.question + ' Fixture ' + i, subject: 'mathematics', year: 2021 })));
  await page.route('**/data/jamb/pools/*.json', route => route.fulfill({ json:
    route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool }));
  await page.goto('/jamb/cbt/?subject=mathematics&year=2021&mode=quick');
  await page.locator('#start-btn').click();
  await expect(page.locator('#setup-warning')).toContainText('does not yet have 10 reviewed questions', { timeout: 60000 });
  await expect(page.locator('#cbt-shell')).toBeHidden();
});
