const assert = require('assert');

const {
  deriveMetaHealth,
  deriveRunScraperHealth,
  deriveScheduledProofHealth,
  inferHealth,
  latestRowStatus,
  liveDataRowStatus,
  nextScheduledAt,
  parseCronField,
  scraperRunNote,
  scheduledProofKey,
} = require('../scripts/audit-live-automation-health');

assert.strictEqual(
  scheduledProofKey('Send Weekly Newsletter'),
  'scheduled-proof-send-weekly-newsletter',
  'scheduled proof keys should match the shared heartbeat helper'
);

assert.deepStrictEqual(
  deriveScheduledProofHealth(`
    const { withScheduledProof } = require('./_shared/scheduled-proof');
    module.exports.handler = withScheduledProof('send-weekly-newsletter', async () => ({ statusCode: 200 }));
  `),
  {
    type: 'live_data_key',
    key: 'scheduled-proof-send-weekly-newsletter',
    note: 'Uses scheduled-proof heartbeat written after the scheduled handler returns.',
  },
  'scheduled proof wrappers should infer a live_data_store evidence key'
);

assert.strictEqual(
  deriveScheduledProofHealth('module.exports.handler = async () => ({ statusCode: 200 });'),
  null,
  'unwrapped scheduled functions should not receive a false heartbeat mapping'
);

assert.deepStrictEqual(
  deriveRunScraperHealth("await runScraper({\n  id: 'fuel-prices',\n});"),
  { type: 'scraper_run', scraperId: 'fuel-prices' },
  'runScraper wrappers should still infer scraper_run evidence'
);

assert.deepStrictEqual(
  deriveMetaHealth("await updateMeta('rates', { updated_at: now });"),
  { type: 'meta', metaKey: 'rates' },
  'meta writes should still infer meta evidence'
);

assert.strictEqual(
  liveDataRowStatus(null, {}),
  null,
  'missing live_data_store rows should not report latest_status=ok'
);

assert.strictEqual(
  liveDataRowStatus({ key: 'scheduled-proof-demo' }, {}),
  'ok',
  'present live_data_store rows without an explicit status should default to ok'
);

assert.strictEqual(
  liveDataRowStatus({ key: 'scheduled-proof-demo' }, { ok: false }),
  'degraded',
  'present live_data_store rows with ok=false should report degraded'
);

assert.strictEqual(
  latestRowStatus(null),
  null,
  'missing table_latest rows should not report latest_status=ok'
);

assert.strictEqual(
  latestRowStatus({ captured_at: '2026-06-30T00:00:00Z' }),
  'ok',
  'present table_latest rows without a status field should default to ok'
);

assert.deepStrictEqual(
  Array.from(parseCronField('7,22,37,52', 0, 59)).sort((a, b) => a - b),
  [7, 22, 37, 52],
  'cron field parser should support comma-separated minutes'
);

assert.deepStrictEqual(
  Array.from(parseCronField('1-5', 0, 7)).sort((a, b) => a - b),
  [1, 2, 3, 4, 5],
  'cron field parser should support day-of-week ranges'
);

assert.strictEqual(
  nextScheduledAt('43 * * * *', new Date('2026-06-30T05:01:10Z')),
  '2026-06-30T05:43:00.000Z',
  'hourly schedules should return the next same-hour fire time'
);

assert.strictEqual(
  nextScheduledAt('18 */2 * * *', new Date('2026-06-30T05:30:00Z')),
  '2026-06-30T06:18:00.000Z',
  'stepped hour schedules should return the next matching hour'
);

assert.strictEqual(
  nextScheduledAt('19 8 * * 1', new Date('2026-06-30T05:00:00Z')),
  '2026-07-06T08:19:00.000Z',
  'weekday schedules should return the next matching weekday in UTC'
);

assert.strictEqual(
  nextScheduledAt('9 8 1 * *', new Date('2026-06-30T05:00:00Z')),
  '2026-07-01T08:09:00.000Z',
  'monthly schedules should return the next matching day of month in UTC'
);

assert.strictEqual(
  scraperRunNote(
    { requireScheduledSource: true },
    null,
    { source: 'Manual livecheck endpoint', fetched_at: '2026-06-30T05:05:00Z' }
  ),
  'No scheduled row found; latest any-source row is Manual livecheck endpoint at 2026-06-30T05:05:00.000Z.',
  'missing scheduled rows should identify the newest non-scheduled row'
);

assert.strictEqual(
  scraperRunNote(
    { requireScheduledSource: true },
    { source: 'Netlify Scheduled Function', fetched_at: '2026-06-30T03:04:44Z' },
    { source: 'Manual livecheck endpoint', fetched_at: '2026-06-30T05:05:00Z' }
  ),
  'Requires a Netlify Scheduled Function scraper_runs row. Latest any-source row is Manual livecheck endpoint at 2026-06-30T05:05:00.000Z; not accepted as scheduled proof.',
  'newer manual rows should be called out as non-proof when scheduled proof is stale'
);

const inferredScheduledProof = inferHealth('send-weekly-newsletter');
assert.strictEqual(inferredScheduledProof.type, 'live_data_key');
assert.strictEqual(inferredScheduledProof.key, 'scheduled-proof-send-weekly-newsletter');

const explicitHealth = inferHealth('scrape-fx-rates');
assert.strictEqual(explicitHealth.type, 'table_latest');
assert.strictEqual(explicitHealth.table, 'fx_snapshots');

console.log('live-automation-health-inference: ok');
