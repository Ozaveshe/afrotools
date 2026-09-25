'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, '../assets/js/lib/analytics.js'), 'utf8');
const cohortKey = 'afrotools_education_practice_cohort_v1';
const dayMs = 86400000;
const firstDay = Date.UTC(2026, 8, 26, 12);

function context(consent = 'accepted') {
  let now = firstDay;
  const store = new Map([['afrotools_cookie_consent', consent]]);
  const calls = [];
  class ClockDate extends Date { static now() { return now; } }
  const window = {
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    location: { pathname: '/jamb/cbt/', search: '' },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    gtag() { calls.push(Array.from(arguments)); },
    setTimeout() { return 1; }, clearTimeout() {},
    setInterval() { return 1; }, clearInterval() {},
    addEventListener() {}
  };
  const document = { readyState: 'loading', addEventListener() {} };
  vm.runInNewContext(source, { window, document, Date: ClockDate, URL, URLSearchParams, Set, console });
  return {
    track: window.AfroTools.analytics.trackEducationPractice,
    events(name) { return calls.filter(call => call[0] === 'event' && call[1] === name).map(call => call[2]); },
    setDay(offset) { now = firstDay + offset * dayMs; },
    store
  };
}

test('one consented JAMB cohort returns once across a later WAEC practice action', () => {
  const visit = context();
  assert.equal(visit.track('jamb', 'mathematics', 'start'), true);
  assert.equal(visit.track('jamb', 'mathematics', 'resume'), false);
  assert.equal(visit.events('education_practice_cohort_started').length, 1);
  assert.equal(visit.events('education_practice_returned').length, 0);
  visit.setDay(1);
  assert.equal(visit.track('waec_neco', 'english', 'start'), true);
  assert.equal(visit.track('waec_neco', 'english', 'resume'), false);
  visit.setDay(4);
  assert.equal(visit.track('jamb', 'physics', 'start'), false);
  assert.equal(visit.events('education_practice_returned').length, 1);
  assert.equal(visit.events('education_practice_returned')[0].cohort_exam, 'jamb');
  assert.equal(visit.events('education_practice_returned')[0].return_exam, 'waec_neco');
  assert.equal(visit.events('education_practice_returned')[0].return_day, 1);
  assert.equal(visit.events('education_practice_returned')[0].cohort_day_utc, '2026-09-26');
});

test('the seven-day return boundary excludes day zero and day eight', () => {
  const within = context();
  within.track('jamb', 'english', 'start');
  within.setDay(7);
  assert.equal(within.track('jamb', 'english', 'resume'), true);
  assert.equal(within.events('education_practice_returned')[0].return_day, 7);
  const late = context();
  late.track('jamb', 'english', 'start');
  late.setDay(8);
  assert.equal(late.track('jamb', 'english', 'resume'), false);
  assert.equal(late.events('education_practice_returned').length, 0);
});

test('declined consent and corrupt local state emit no cohort event or private value', () => {
  const declined = context('declined');
  assert.equal(declined.track('jamb', 'english', 'start'), false);
  assert.equal(declined.store.has(cohortKey), false);
  const corrupt = context();
  corrupt.store.set(cohortKey, JSON.stringify({ day: Math.floor(firstDay / dayMs), exam: 'jamb', subject: 'private@example.com', returned: false }));
  corrupt.setDay(1);
  assert.equal(corrupt.track('waec_neco', 'english', 'resume'), false);
  assert.equal(corrupt.events('education_practice_returned').length, 0);
});

test('invalid actions and unavailable storage fail closed', () => {
  const visit = context();
  assert.equal(visit.track('jamb', 'english', 'complete'), false);
  assert.equal(visit.track('unknown', 'english', 'start'), false);
  assert.equal(visit.events('education_practice_cohort_started').length, 0);
});
