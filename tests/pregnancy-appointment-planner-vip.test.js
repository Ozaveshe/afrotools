'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../health/pregnancy-due-date/pregnancy-appointment-engine.js');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'health/pregnancy-due-date/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'health/pregnancy-due-date/pregnancy-appointment-planner.js'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/due-date.json'), 'utf8'));

{
  const plan = engine.calculate({
    basis: 'lmp',
    date: '2026-01-01',
    cycleLength: 28,
    asOf: '2026-07-26',
  });
  assert.equal(plan.valid, true);
  assert.equal(plan.dueDate, '2026-10-08');
  assert.equal(plan.week37Date, '2026-09-17');
  assert.equal(plan.week42Date, '2026-10-22');
  assert.deepEqual(plan.gestationalAge, { totalDays: 206, weeks: 29, days: 3 });
  assert.equal(plan.contacts.length, 8);
  assert.equal(plan.contacts[0].date, '2026-03-26');
  assert.equal(plan.contacts[7].date, '2026-10-08');
}

{
  const plan = engine.calculate({
    basis: 'confirmed-edd',
    date: '2026-12-20',
    asOf: '2026-07-26',
  });
  assert.equal(plan.valid, true);
  assert.equal(plan.dueDate, '2026-12-20');
  assert.equal(plan.contacts[7].date, '2026-12-20');
}

for (const cycleLength of [21, 35]) {
  const initial = engine.calculate({
    basis: 'lmp',
    date: '2026-01-01',
    cycleLength,
    asOf: '2026-01-01',
  });
  const atDueDate = engine.calculate({
    basis: 'lmp',
    date: '2026-01-01',
    cycleLength,
    asOf: initial.dueDate,
  });
  assert.deepEqual(
    atDueDate.gestationalAge,
    { totalDays: 280, weeks: 40, days: 0 },
    'cycle-adjusted due date must remain the week-40 contact base'
  );
  assert.equal(atDueDate.contacts[7].date, initial.dueDate);
}

assert.equal(engine.calculate({
  basis: 'lmp',
  date: '2026-08-01',
  cycleLength: 28,
  asOf: '2026-07-26',
}).valid, false);
assert.equal(engine.calculate({
  basis: 'confirmed-edd',
  date: '2026-07-11',
  asOf: '2026-07-26',
}).valid, false);
assert.equal(engine.calculate({
  basis: 'confirmed-edd',
  date: '2027-05-03',
  asOf: '2026-07-26',
}).valid, false);
assert.equal(engine.calculate({
  basis: 'confirmed-edd',
  date: '2026-07-12',
  asOf: '2026-07-26',
}).valid, true);
assert.equal(engine.calculate({
  basis: 'confirmed-edd',
  date: '2027-05-02',
  asOf: '2026-07-26',
}).valid, true);
assert.equal(engine.calculate({
  basis: 'lmp',
  date: '2026-01-01',
  cycleLength: 36,
  asOf: '2026-07-26',
}).valid, false);
assert.equal(engine.calculate({
  basis: 'lmp',
  date: 'not-a-date',
  cycleLength: 28,
  asOf: '2026-07-26',
}).valid, false);

assert.match(html, /Antenatal appointment date planner/);
assert.match(html, /Need only a quick due-date range/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.match(html, /Dates must not delay care/);
assert.match(html, /No upload/);
assert.match(html, /Download TXT plan/);
assert.match(html, /Download PDF plan/);
assert.match(html, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/health\/pregnancy-due-date\/"/);
assert.match(html, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/tarehe-ya-kujifungua\/"/);
assert.match(script, /DTSTAMP:/);
assert.match(script, /DTEND;VALUE=DATE:/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare/i);
assert.doesNotMatch(html, /email.gat|account required|hospitalCosts|Hospital Delivery Cost Estimator/i);
assert.doesNotMatch(script, /fetch\s*\(|XMLHttpRequest|sendBeacon/);
assert.match(script, /localStorage\.setItem\(storageKey/);
assert.match(script, /if \(rememberInput\.checked\)/);
assert.equal(context.toolKey, 'due-date');
assert.match(context.staticText, /distinct purpose/i);
assert.match(context.staticText, /never as a booked appointment, diagnosis/i);
assert.match(context.staticText, /never put dates in URLs or analytics/i);

console.log('pregnancy appointment planner VIP tests passed');
