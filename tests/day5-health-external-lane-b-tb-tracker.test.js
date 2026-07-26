'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/tb-tracker/tb-date-engine.js');

test('strict calendar parsing and whole UTC-day comparison handle leap days', () => {
  const result = engine.review({
    today: '2024-02-28',
    appointment: '2024-03-01',
    appointmentStatus: 'scheduled'
  });
  assert.equal(result.items[0].days, 2);
  assert.throws(() => engine.review({ today: '2026-02-29' }), /valid calendar date/i);
  assert.throws(() => engine.review({ today: '26-07-2026' }), /YYYY-MM-DD/);
});

test('a past scheduled date requires clinic confirmation', () => {
  const result = engine.review({
    today: '2026-07-26',
    appointment: '2026-07-24',
    appointmentStatus: 'scheduled'
  });
  assert.equal(result.level, 'One or more date entries need clinic confirmation');
  assert.match(result.issues[0], /past and not marked completed/i);
  assert.match(result.action, /Do not infer anything about diagnosis, treatment response, infectiousness or medicine use/i);
});

test('a past completed date is a logistical record, not overdue or adherence proof', () => {
  const result = engine.review({
    today: '2026-07-26',
    sample: '2026-07-24',
    sampleStatus: 'completed'
  });
  assert.equal(result.level, 'Clinic dates organised');
  assert.equal(result.issues.length, 0);
  assert.match(result.items[0].context, /logistical record only/i);
});

test('future completed status and same-episode reversed sequence are flagged', () => {
  const futureCompleted = engine.review({
    today: '2026-07-26',
    result: '2026-07-30',
    resultStatus: 'completed'
  });
  const reversed = engine.review({
    today: '2026-07-26',
    sample: '2026-08-02',
    sampleStatus: 'scheduled',
    result: '2026-08-01',
    resultStatus: 'scheduled',
    sameEpisode: true
  });
  assert.match(futureCompleted.issues[0], /future but marked completed/i);
  assert.match(reversed.issues[0], /same episode/i);
});

test('changed dates and unrelated sample/result entries do not create false overdue or sequence claims', () => {
  const changed = engine.review({
    today: '2026-07-26',
    appointment: '2026-07-20',
    appointmentStatus: 'changed'
  });
  const unrelated = engine.review({
    today: '2026-07-26',
    sample: '2026-08-02',
    result: '2026-08-01',
    sameEpisode: false
  });
  assert.equal(changed.level, 'Clinic dates organised');
  assert.equal(unrelated.issues.length, 0);
  assert.match(changed.items[0].context, /replacement date or clinic instruction/i);
});

test('route, export, privacy and AI context preserve logistical-only boundaries', () => {
  const html = fs.readFileSync(path.join(root, 'tools/tb-tracker/index.html'), 'utf8');
  const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/tb-tracker.json'), 'utf8'));
  assert.match(html, /Appointment logistical status/);
  assert.match(html, /same clinic episode/);
  assert.match(html, /Planning date:[\s\S]*status:[\s\S]*Result[\s\S]*Assumption[\s\S]*Warning/);
  assert.match(html, /No date or status is evidence about diagnosis, treatment response, infectiousness, medicine use or adherence/i);
  assert.doesNotMatch(html, /fetch\s*\(|sendBeacon|localStorage|sessionStorage|fonts\.googleapis|cdn\.jsdelivr/i);
  assert.ok(context.disallowed.includes('giving treatment or adherence advice'));
  const hash = crypto.createHash('sha256').update(context.staticText).digest('hex');
  assert.equal(context.legacyTextSha256, `sha256:${hash}`);
});
