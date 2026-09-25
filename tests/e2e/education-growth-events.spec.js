const { test, expect } = require('@playwright/test');
const { bank } = require('../support/jamb-reviewed-fixtures');

async function educationGtagEvents(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map((command) => Array.from(command))
    .filter(([action, name]) => action === 'event' && /^education_/.test(name))
    .map(([, name, params]) => ({ name, params })));
}

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

for (const consent of ['accepted', 'declined']) {
  test(`real analytics wrapper ${consent} consent gates education practice events`, async ({ page }) => {
    const fixture = bank();
    await page.addInitScript((status) => {
      try { localStorage.setItem('afrotools_cookie_consent', status); } catch (_) {}
    }, consent);
    await page.route('**/*', (route) => {
      const host = new URL(route.request().url()).hostname;
      return ['127.0.0.1', 'localhost'].includes(host) ? route.continue() : route.abort();
    });
    await page.route('**/data/jamb/pools/*.json', (route) => route.fulfill({
      json: route.request().url().endsWith('/index.json') ? fixture.index : fixture.pool
    }));

    await page.goto('/tools/ssce-practice/', { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.AfroTools?.analytics?.track === 'function' && typeof window.gtag === 'function');
    await page.getByLabel('Subject', { exact: true }).selectOption('English');
    await page.getByLabel('Topic', { exact: true }).selectOption('Writing decisions');
    await page.getByRole('button', { name: 'Start practice', exact: true }).click();
    const started = await educationGtagEvents(page);
    if (consent === 'accepted') {
      expect(started).toEqual([
        { name: 'education_practice_start', params: {
          exam: 'waec_neco', subject: 'english', entry: 'new', question_count: '1-4'
        } },
        { name: 'education_practice_cohort_started', params: {
          action: 'start',
          cohort_day_utc: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
          cohort_exam: 'waec_neco',
          cohort_subject: 'english'
        } }
      ]);
    } else {
      expect(started).toEqual([]);
    }

    await page.getByRole('button', { name: 'Save progress on this device' }).click();
    await page.reload({ waitUntil: 'load' });
    await page.getByRole('button', { name: 'Resume saved practice' }).click();
    const resumed = await educationGtagEvents(page);
    expect(resumed.map((event) => event.name)).toEqual(consent === 'accepted' ? ['education_practice_resume'] : []);

    await page.goto('/jamb/cbt/', { waitUntil: 'load' });
    await page.waitForFunction(() => typeof window.AfroTools?.analytics?.track === 'function' && typeof window.gtag === 'function');
    await page.locator('#start-btn').click();
    await expect(page.locator('#cbt-shell')).toBeVisible();
    const jamb = await educationGtagEvents(page);
    expect(jamb.map((event) => event.name)).toEqual(consent === 'accepted' ? ['education_jamb_start'] : []);
    if (consent === 'accepted') {
      expect(jamb[0].params).toEqual({ mode: 'full', subject: 'mixed', question_count: '1-14' });
    }
    expect(JSON.stringify([started, resumed, jamb])).not.toMatch(/prompt|answer|passage|question_id|pool_revision|task-|revision=|private@example\.com/i);
  });
}
