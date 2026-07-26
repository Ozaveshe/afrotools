#!/usr/bin/env node
'use strict';

// Regression test: automation-health staleness must be judged against the last
// SCHEDULED occurrence, not wall-clock age.
//
// statusFor() compares age against a flat SLA, which is wrong for any cron that
// does not fire uniformly. `scheduled-fetch-stocks` runs hourly on weekdays only
// (`11 * * * 1-5`) with a 2h SLA, so from Friday 23:11 until Monday morning it is
// always "15+ hours old" and was reported stale every single weekend -- a
// guaranteed false alarm two days in seven, in the one channel meant to tell you
// whether public data is fresh.
//
// The fix must clear that without hiding a real miss: three weekly scrapers each
// skipped exactly one occurrence (2026-07-20 and 2026-07-24) and must stay flagged.

const assert = require('assert');
const {
  previousScheduledAt,
  reconcileStatusWithSchedule,
} = require('../scripts/audit-live-automation-health.js');

// Saturday 2026-07-25 14:32 UTC -- the moment the false positive was observed.
const NOW = new Date('2026-07-25T14:32:00Z');
const NOW_MS = NOW.getTime();

function run() {
  // ---- previousScheduledAt walks backwards correctly ----------------------
  assert.strictEqual(
    previousScheduledAt('11 * * * 1-5', NOW),
    '2026-07-24T23:11:00.000Z',
    'weekday-only hourly cron must resolve back to Friday, not Saturday'
  );
  assert.strictEqual(previousScheduledAt('41 3 * * 1', NOW), '2026-07-20T03:41:00.000Z');
  assert.strictEqual(previousScheduledAt('47 3 * * 5', NOW), '2026-07-24T03:47:00.000Z');
  assert.strictEqual(previousScheduledAt('19 8 * * 1', NOW), '2026-07-20T08:19:00.000Z');
  assert.strictEqual(previousScheduledAt('not a cron', NOW), null, 'garbage cron must not throw');

  // ---- the weekend false positive is cleared ------------------------------
  const stocks = reconcileStatusWithSchedule(
    { status: 'stale', latest_at: '2026-07-24T23:11:35.728Z', age_hours: 15.3 },
    '11 * * * 1-5',
    NOW_MS
  );
  assert.strictEqual(
    stocks.status,
    'ok',
    'a weekday-only job that ran at its last weekday slot is not stale on Saturday'
  );
  assert.strictEqual(stocks.previous_scheduled_at, '2026-07-24T23:11:00.000Z');

  // ---- genuine misses must survive ---------------------------------------
  const genuine = [
    ['insurance', '41 3 * * 1', '2026-07-13T03:41:15.555Z'],
    ['salaries', '47 3 * * 5', '2026-07-17T03:47:31.437Z'],
    ['newsletter', '19 8 * * 1', '2026-07-13T08:19:54.309Z'],
  ];
  for (const [name, cron, latest] of genuine) {
    const result = reconcileStatusWithSchedule({ status: 'stale', latest_at: latest }, cron, NOW_MS);
    assert.strictEqual(
      result.status,
      'stale',
      name + ' skipped a scheduled occurrence and must stay flagged'
    );
  }

  // ---- the fix must not launder other statuses ----------------------------
  const missing = reconcileStatusWithSchedule({ status: 'missing', latest_at: null }, '8 * * * *', NOW_MS);
  assert.strictEqual(missing.status, 'missing', 'a check that never ran must never be reconciled to ok');

  const degraded = reconcileStatusWithSchedule(
    { status: 'degraded', latest_at: '2026-07-25T14:00:00Z' },
    '11 * * * 1-5',
    NOW_MS
  );
  assert.strictEqual(degraded.status, 'degraded', 'a failing run must never be reconciled to ok');

  // No schedule known -> leave the verdict untouched rather than guess.
  const noCron = reconcileStatusWithSchedule({ status: 'stale', latest_at: '2026-07-01T00:00:00Z' }, null, NOW_MS);
  assert.strictEqual(noCron.status, 'stale');

  console.log('automation-health-cron-sla.test.js passed');
}

run();
