const { test, expect } = require('@playwright/test');
const { bank } = require('../support/jamb-reviewed-fixtures');

test('practice and revision actions report only coarse consent-wrapper metrics', async ({ page }) => {
  await page.goto('/tools/ssce-practice/');
  await page.evaluate(() => {
    window.__educationEvents = [];
    window.AfroTools.analytics.track = (name, params) => window.__educationEvents.push({ name, params });
  });
  await page.getByLabel('Subject', { exact: true }).selectOption('English');
  await page.getByLabel('Topic', { exact: true }).selectOption('Writing decisions');
  await page.getByRole('button', { name: 'Start practice', exact: true }).click();
  for (let index = 0; index < 2; index += 1) {
    await page.getByRole('radio').first().check();
    await page.getByRole('button', { name: 'Check answer', exact: true }).click();
    await page.getByRole('button', { name: index ? 'See results' : 'Next question', exact: true }).click();
  }
  await page.getByRole('button', { name: 'Save a revision session for tomorrow', exact: true }).click();
  const events = await page.evaluate(() => window.__educationEvents);
  expect(events.map((event) => event.name)).toEqual([
    'education_practice_start', 'education_practice_complete', 'education_revision_saved'
  ]);
  expect(events[0].params).toEqual({ exam: 'waec_neco', subject: 'english', entry: 'new', question_count: '1-4' });
  expect(events[1].params.score_band).toMatch(/^(0-24|25-49|50-74|75-99|100-100)$/);
  expect(JSON.stringify(events)).not.toMatch(/prompt|answer|passage|task-|revision=|date|topic/i);
});

test('study completion records a source enum without the student topic', async ({ page }) => {
  await page.goto('/tools/education-hub/#daily-study');
  await page.evaluate(() => {
    window.__educationEvents = [];
    window.AfroTools.analytics.track = (name, params) => window.__educationEvents.push({ name, params });
  });
  await page.getByLabel('Subject or topic').fill('Private synthetic study topic');
  await page.getByRole('button', { name: 'Add session' }).click();
  await page.getByRole('button', { name: 'Mark done' }).click();
  const events = await page.evaluate(() => window.__educationEvents);
  expect(events).toEqual([{ name: 'education_study_session_complete', params: { source: 'study_plan' } }]);
});

test('JAMB CBT reports a coarse start and completion without question data', async ({ page }) => {
  const fixture = bank();
  await page.route('**/*', (route) => {
    const host = new URL(route.request().url()).hostname;
    return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
  });
  await page.route('**/data/jamb/pools/*.json', (route) => route.fulfill({
    json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool
  }));
  await page.route('**/.netlify/functions/jamb-attempt', (route) => route.fulfill({ json: { ok: true } }));
  await page.goto('/jamb/cbt/', { waitUntil: 'load' });
  await page.evaluate(() => {
    window.__educationEvents = [];
    window.AfroTools.analytics.track = (name, params) => window.__educationEvents.push({ name, params });
  });
  await page.locator('#start-btn').click();
  await expect(page.locator('#cbt-shell')).toBeVisible();
  await page.locator('#cbt-submit-top').click();
  await page.locator('#confirm-submit-btn').click();
  await expect(page.locator('#results-screen')).toBeVisible();
  const events = await page.evaluate(() => window.__educationEvents);
  expect(events.map((event) => event.name)).toEqual(['education_jamb_start', 'education_jamb_complete']);
  expect(events[0].params).toEqual({ mode: 'full', subject: 'mixed', question_count: '1-14' });
  expect(events[1].params).toMatchObject({ mode: 'full', subject: 'mixed', question_count: '1-14', timed_out: false });
  expect(JSON.stringify(events)).not.toMatch(/prompt|answer|passage|question_id|pool_revision|task-|date/i);
});
