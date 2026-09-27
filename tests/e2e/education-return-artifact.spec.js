const path = require('node:path');
const { test, expect } = require('@playwright/test');

const firstDay = Date.UTC(2026, 8, 26, 12);
const dayMs = 86400000;

async function educationEvents(page) {
  return page.evaluate(() => (window.dataLayer || [])
    .map((command) => Array.from(command))
    .filter(([action, name]) => action === 'event' && /^education_/.test(name))
    .map(([, name, params]) => ({ name, params })));
}

async function saveWritten(page, collection, response) {
  await page.locator('#written-collection').selectOption(collection);
  await page.getByLabel('Your written answer').fill(response);
  await page.getByRole('button', { name: 'Save response on this device' }).click();
  await expect(page.locator('#written-status')).toHaveText('Response saved on this device.');
}

test('original JAMB practice starts a consented cohort that returns through WAEC the next day', async ({ page }) => {
  await page.addInitScript((start) => {
    const saved = sessionStorage.getItem('__educationTestNow');
    window.__educationTestNow = saved ? Number(saved) : start;
    Date.now = () => window.__educationTestNow;
    try { localStorage.setItem('afrotools_cookie_consent', 'accepted'); } catch (_) {}
  }, firstDay);
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({
    status: 200, contentType: 'application/javascript', body: 'window.__fakeGoogleTagLoaded = true;'
  }));
  await page.route('https://www.google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/jamb/original-practice/?subject=english', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.AfroTools?.analytics?.trackEducationPractice === 'function');
  await expect(page.locator('#start-btn')).toBeEnabled();
  await page.locator('#start-btn').click();
  await expect(page.locator('#quiz-screen')).toBeVisible();
  let events = await educationEvents(page);
  expect(events.map((event) => event.name)).toEqual([
    'education_jamb_original_start', 'education_practice_cohort_started'
  ]);
  expect(events.at(-1).params).toMatchObject({ cohort_exam: 'jamb', cohort_subject: 'english', action: 'start' });
  await page.evaluate((next) => sessionStorage.setItem('__educationTestNow', String(next)), firstDay + dayMs);
  await page.goto('/tools/ssce-practice/', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.AfroTools?.analytics?.trackEducationPractice === 'function');
  await saveWritten(page, 'WAEC 2023 Mathematics companion', 'Synthetic private answer remains on this device');
  events = await educationEvents(page);
  expect(events.map((event) => event.name)).toEqual([
    'education_written_response_saved', 'education_practice_returned'
  ]);
  expect(events.at(-1).params).toMatchObject({
    cohort_exam: 'jamb', return_exam: 'waec', return_subject: 'mathematics', return_day: 1
  });
  expect(JSON.stringify(events)).not.toMatch(/Synthetic private answer|question_id|written-/);
});

test('real wrapper measures WAEC-to-NECO day-one return and renews on day eight with consent', async ({ page }) => {
  await page.addInitScript((start) => {
    window.__educationTestNow = start;
    Date.now = () => window.__educationTestNow;
    try { localStorage.setItem('afrotools_cookie_consent', 'accepted'); } catch (_) {}
  }, firstDay);
  await page.route('https://www.googletagmanager.com/**', (route) => route.fulfill({
    status: 200, contentType: 'application/javascript', body: 'window.__fakeGoogleTagLoaded = true;'
  }));
  await page.route('https://www.google-analytics.com/**', (route) => route.fulfill({ status: 204, body: '' }));
  await page.goto('/tools/ssce-practice/', { waitUntil: 'load' });
  await page.waitForFunction(() => typeof window.AfroTools?.analytics?.trackEducationPractice === 'function' &&
    typeof window.AfroTools?.analyticsConsent?.decline === 'function' && typeof window.gtag === 'function');

  // Source checkout still serves an older generated core bundle. Artifact mode
  // intentionally omits this injection and proves the rebuilt bundle itself.
  if (process.env.AFROTOOLS_TEST_PUBLISH_ARTIFACT !== '1') {
    await page.addScriptTag({ path: path.join(__dirname, '../../assets/js/lib/analytics.js') });
  }

  const privateAnswer = 'Synthetic private working that must stay on this device';
  await saveWritten(page, 'WAEC 2023 Mathematics companion', privateAnswer);
  let events = await educationEvents(page);
  expect(events.map((event) => event.name)).toEqual([
    'education_written_response_saved', 'education_practice_cohort_started'
  ]);
  expect(events[0].params).toEqual({ exam: 'waec', subject: 'mathematics', collection_year: 2023 });
  expect(events[1].params).toMatchObject({ cohort_exam: 'waec', cohort_subject: 'mathematics', action: 'start' });

  await page.evaluate((next) => { window.__educationTestNow = next; }, firstDay + dayMs);
  await saveWritten(page, 'NECO 2023 Mathematics starter', privateAnswer + ' day one');
  events = await educationEvents(page);
  expect(events.slice(-2).map((event) => event.name)).toEqual([
    'education_written_response_saved', 'education_practice_returned'
  ]);
  expect(events.at(-1).params).toMatchObject({
    cohort_exam: 'waec', return_exam: 'neco', return_subject: 'mathematics', return_day: 1
  });

  await page.evaluate((next) => { window.__educationTestNow = next; }, firstDay + 8 * dayMs);
  await saveWritten(page, 'WAEC 2023 Mathematics companion', privateAnswer + ' day eight');
  events = await educationEvents(page);
  expect(events.slice(-2).map((event) => event.name)).toEqual([
    'education_written_response_saved', 'education_practice_cohort_started'
  ]);
  expect(events.at(-1).params).toMatchObject({ cohort_exam: 'waec', cohort_subject: 'mathematics' });

  await page.evaluate(() => window.AfroTools.analyticsConsent.decline());
  expect(await page.evaluate(() => localStorage.getItem('afrotools_education_practice_cohort_v1'))).toBeNull();
  const beforeDeclinedSave = (await educationEvents(page)).length;
  await saveWritten(page, 'NECO 2023 Mathematics starter', privateAnswer + ' declined');
  expect((await educationEvents(page)).length).toBe(beforeDeclinedSave);
  await page.evaluate(() => window.AfroTools.analyticsConsent.accept());
  await saveWritten(page, 'NECO 2023 Mathematics starter', privateAnswer + ' reaccepted');
  events = await educationEvents(page);
  expect(events.slice(-2).map((event) => event.name)).toEqual([
    'education_written_response_saved', 'education_practice_cohort_started'
  ]);
  expect(events.at(-1).params.cohort_exam).toBe('neco');
  expect(JSON.stringify(events)).not.toMatch(/Synthetic private working|question_id|written-/);
});
