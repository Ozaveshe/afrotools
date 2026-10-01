const { test } = require('node:test');
const assert = require('node:assert/strict');
const { exportCapture, captureSql } = require('../scripts/car-market-public-export');
const now = new Date('2026-10-01T18:00:00Z');
const registry = { sources: { dealer: { domain: 'example.org', access_status: 'manual-only' } } };
const options = { now, vehicles: new Set(['toyota-camry-2012']) };
function fixture() {
  const members = [1000000, 2000000, 3000000].map((asking_price, index) => ({ observation_id: 'id-' + index, listing_key: 'key-' + index, current_revision: true, review_status: 'accepted', reviewed_at: '2026-10-01T17:00:00Z', vehicle_id: 'toyota-camry-2012', country_code: 'NG', condition_label: 'foreign-used', currency: 'NGN', asking_price, observed_at: '2026-10-01T16:00:00Z', listing_url: 'https://example.org/car-' + index, source_id: 'dealer', source_name: 'Synthetic dealer', source_domain: 'example.org', source_access_status: 'manual-only', seller_phone: 'MUST NOT EXPORT' }));
  return { project_ref: 'zpclagtgczsygrgztlts', queried_at: now.toISOString(), snapshots: [{ snapshot_id: 'synthetic-snapshot', vehicle_id: 'toyota-camry-2012', country_code: 'NG', market: 'Lagos', condition_label: 'foreign-used', currency: 'NGN', lower_quartile: 1500000, median_ask: 2000000, upper_quartile: 2500000, sample_size: 3, observed_from: members[0].observed_at, observed_to: members[0].observed_at, method: 'Quartiles of reviewed asking prices', limitations: 'Asking prices, not sale prices', status: 'published', reviewed_at: members[0].reviewed_at, published_at: '2026-10-01T17:30:00Z', members }] };
}
test('exports reviewed comparable bands and strips private fields', () => {
  const result = exportCapture(fixture(), registry, options);
  assert.equal(result.publicPack.observations.length, 1);
  assert.equal(result.publicPack.observations[0].median, 2000000);
  assert.equal(result.publicPack.observations[0].sources.length, 3);
  for (const secret of ['seller_phone', 'MUST NOT EXPORT', 'listing_key', 'observation_id', 'members']) assert.ok(!JSON.stringify(result.publicPack).includes(secret));
});
test('wrong project and stale capture fail before writing', () => {
  for (const edit of [c => c.project_ref = 'wrong-project', c => c.queried_at = '2026-09-01T00:00:00Z']) { const c = fixture(); edit(c); assert.throws(() => exportCapture(c, registry, options)); }
});
const cases = {
  draft: s => s.status = 'draft',
  stale: s => s.observed_from = '2026-09-01T00:00:00Z',
  unreviewed: s => s.reviewed_at = null,
  'changed revision': s => s.members[0].current_revision = false,
  'rejected listing': s => s.members[0].review_status = 'rejected',
  'withdrawn live source': s => s.members[0].source_access_status = 'blocked',
  'mixed currency': s => s.members[0].currency = 'USD',
  'mixed condition': s => s.members[0].condition_label = 'local-used',
  'duplicate URL': s => s.members[0].listing_url = s.members[1].listing_url,
  'duplicate revision': s => s.members[0].observation_id = s.members[1].observation_id,
  'unsafe URL': s => s.members[0].listing_url = 'https://example.org/car?phone=123',
  'wrong quartile': s => s.lower_quartile = 1400000,
  'too few listings': s => { s.members.pop(); s.sample_size = 2; },
  'future publication': s => s.published_at = '2027-01-01T00:00:00Z'
};
for (const [name, edit] of Object.entries(cases)) test('excludes ' + name, () => { const c = fixture(); edit(c.snapshots[0]); const r = exportCapture(c, registry, options); assert.equal(r.publicPack.observations.length, 0); assert.equal(r.excluded.length, 1); });
test('local source withdrawal excludes previously published snapshot', () => {
  assert.equal(exportCapture(fixture(), { sources: { dealer: { domain: 'example.org', access_status: 'review-needed' } } }, options).publicPack.observations.length, 0);
});
test('empty live ledger exports no fabricated range', () => {
  const c = fixture(); c.snapshots = []; assert.deepEqual(exportCapture(c, registry, options).publicPack.observations, []);
});
test('read-only capture joins current history and does not query research', () => {
  const sql = captureSql(); assert.ok(sql.includes('car_market_observation_history')); assert.ok(sql.includes("where s.status = 'published'")); assert.ok(!sql.includes('car_market_research')); assert.ok(!/insert|update|delete/i.test(sql));
});
