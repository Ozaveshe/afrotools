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

function context(consent = 'accepted', { gtagAvailable = true } = {}) {
  let now = firstDay;
  const store = new Map([['afrotools_cookie_consent', consent]]);
  const calls = [];
  const listeners = {};
  const intervals = [];
  class ClockDate extends Date { static now() { return now; } }
  const window = {
    localStorage: {
      getItem(key) { return store.has(key) ? store.get(key) : null; },
      setItem(key, value) { store.set(key, String(value)); },
      removeItem(key) { store.delete(key); }
    },
    location: { pathname: '/jamb/cbt/', search: '' },
    sessionStorage: { getItem() { return null; }, setItem() {} },
    setTimeout() { return 1; }, clearTimeout() {},
    setInterval(handler) { intervals.push(handler); return intervals.length; }, clearInterval() {},
    addEventListener(type, handler) { (listeners[type] ||= []).push(handler); }
  };
  if (gtagAvailable) window.gtag = (...args) => calls.push(args);
  const document = { readyState: 'loading', addEventListener() {} };
  vm.runInNewContext(source, { window, document, Date: ClockDate, URL, URLSearchParams, Set, console });
  return {
    track: window.AfroTools.analytics.trackEducationPractice,
    trackFeature: window.AfroTools.analytics.trackFeature,
    events(name) { return calls.filter(call => call[0] === 'event' && call[1] === name).map(call => call[2]); },
    enableGtag() { window.gtag = (...args) => calls.push(args); },
    flush() { intervals.forEach(handler => handler()); },
    setDay(offset) { now = firstDay + offset * dayMs; },
    setConsent(value) {
      store.set('afrotools_cookie_consent', value);
      (listeners['afrotools:cookie-consent'] || []).forEach(handler => handler({ detail: { status: value } }));
    },
    crossTabConsent(value) {
      store.set('afrotools_cookie_consent', value);
      (listeners.storage || []).forEach(handler => handler({ key: 'afrotools_cookie_consent', newValue: value }));
    },
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

test('day eight starts a new cohort and its next-day return is counted once', () => {
  const within = context();
  within.track('jamb', 'english', 'start');
  within.setDay(7);
  assert.equal(within.track('jamb', 'english', 'resume'), true);
  assert.equal(within.events('education_practice_returned')[0].return_day, 7);
  within.setDay(8);
  assert.equal(within.track('waec', 'mathematics', 'start'), true);
  assert.equal(within.events('education_practice_cohort_started').length, 2);
  assert.equal(within.events('education_practice_cohort_started')[1].cohort_exam, 'waec');
  assert.equal(within.track('waec', 'mathematics', 'resume'), false);
  within.setDay(9);
  assert.equal(within.track('neco', 'english', 'start'), true);
  assert.equal(within.events('education_practice_returned').length, 2);
  assert.equal(within.events('education_practice_returned')[1].cohort_exam, 'waec');
  assert.equal(within.events('education_practice_returned')[1].return_exam, 'neco');
  assert.equal(within.events('education_practice_returned')[1].return_day, 1);
  assert.equal(within.track('neco', 'english', 'retry'), false);
});

test('withdrawing consent clears the marker and does not turn later acceptance into a return', () => {
  const visit = context();
  assert.equal(visit.track('jamb', 'english', 'start'), true);
  assert.equal(visit.store.has(cohortKey), true);
  visit.setConsent('declined');
  assert.equal(visit.store.has(cohortKey), false);
  visit.setDay(1);
  assert.equal(visit.track('neco', 'mathematics', 'start'), false);
  assert.equal(visit.events('education_practice_returned').length, 0);
  visit.setConsent('accepted');
  assert.equal(visit.track('neco', 'mathematics', 'start'), true);
  assert.equal(visit.events('education_practice_cohort_started').length, 2);
  assert.equal(visit.events('education_practice_returned').length, 0);
  visit.crossTabConsent('declined');
  assert.equal(visit.store.has(cohortKey), false);
});

test('withdrawal drops pre-gtag events, so reacceptance cannot replay old activity', () => {
  const visit = context('accepted', { gtagAvailable: false });
  assert.equal(visit.track('jamb', 'english', 'start'), true);
  visit.trackFeature('revision', 'jamb');
  assert.equal(visit.store.has(cohortKey), true);
  visit.setConsent('declined');
  assert.equal(visit.store.has(cohortKey), false);
  visit.setConsent('accepted');
  visit.enableGtag();
  visit.flush();
  assert.equal(visit.events('education_practice_cohort_started').length, 0);
  assert.equal(visit.events('feature_used').length, 0);
  assert.equal(visit.track('neco', 'mathematics', 'start'), true);
  assert.equal(visit.events('education_practice_cohort_started').length, 1);
  assert.equal(visit.events('education_practice_cohort_started')[0].cohort_exam, 'neco');
});

test('cross-tab withdrawal also drops pre-gtag events before later acceptance', () => {
  const visit = context('accepted', { gtagAvailable: false });
  assert.equal(visit.track('waec', 'english', 'start'), true);
  visit.crossTabConsent('declined');
  visit.crossTabConsent('accepted');
  visit.enableGtag();
  visit.flush();
  assert.equal(visit.events('education_practice_cohort_started').length, 0);
  assert.equal(visit.store.has(cohortKey), false);
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
  const unknownSubject = context();
  assert.equal(unknownSubject.track('waec', 'private@example.com', 'start'), true);
  assert.equal(unknownSubject.events('education_practice_cohort_started')[0].cohort_subject, 'other');
  assert.doesNotMatch(JSON.stringify(unknownSubject.events('education_practice_cohort_started')), /private@example/);
});

test('invalid actions and unavailable storage fail closed', () => {
  const visit = context();
  assert.equal(visit.track('jamb', 'english', 'complete'), false);
  assert.equal(visit.track('unknown', 'english', 'start'), false);
  assert.equal(visit.events('education_practice_cohort_started').length, 0);
});
