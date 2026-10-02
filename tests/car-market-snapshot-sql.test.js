const assert = require('node:assert/strict');
const { test } = require('node:test');
const { snapshotSql } = require('../scripts/car-market-snapshot-sql');

test('snapshot uses only accepted recent comparables and stays draft', () => {
  const sql = snapshotSql({ vehicleId: 'toyota-camry-2005', countryCode: 'NG', condition: 'foreign-used', currency: 'NGN' });
  assert.match(sql, /review_status = 'accepted'/);
  assert.match(sql, /interval '14 days'/);
  assert.match(sql, /sample_size >= 3/);
  assert.match(sql, /distinct_urls = sample_size/);
  assert.match(sql, /group by market_key, trim_key, engine_cc/);
  assert.match(sql, /o.engine_cc between 100 and 12000/);
  assert.match(sql, /o.reviewed_at >= o.observed_at/);
  assert.match(sql, /o.observed_at <= now\(\)/);
  assert.match(sql, /join public.car_market_observation_history/);
  assert.match(sql, /s.observation_ids = a.observation_ids/);
  assert.match(sql, /s.access_status in \('manual-only', 'automated-approved'\)/);
  assert.match(sql, /'draft'/);
  assert.doesNotMatch(sql, /'published'\s*\nfrom aggregate/);
});
test('snapshot rejects unknown vehicles and unsafe identifiers', () => {
  assert.throws(() => snapshotSql({ vehicleId: "toyota';drop", countryCode: 'NG', condition: 'foreign-used', currency: 'NGN' }));
  assert.throws(() => snapshotSql({ vehicleId: 'toyota-camry-2005', countryCode: 'NG', condition: 'mixed', currency: 'NGN' }));
});
