const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validate, researchSql, catalog } = require('../scripts/car-market-research');
const now = new Date('2026-10-01T17:00:00Z');
const sources = { test: { domain: 'example.org', access_status: 'review-needed' } };
const row = { source_id: 'test', listing_url: 'https://example.org/cars/123', observed_at: '2026-10-01T16:00:00Z', listing_added_on: '2024-08-09', vehicle_id: 'toyota-corolla-2016', make: 'Toyota', model: 'Corolla', model_year: 2016, country_code: 'NG', market: 'Lagos', condition_label: 'foreign-used', trim_label: 'LE', asking_price: 15000000, currency: 'NGN', verification_level: 'detail-page-checked' };

test('dated research stays unapproved and old inventory is flagged', () => {
  const rows = validate([row], sources, catalog(), now);
  assert.deepEqual(rows[0].quality_flags, ['availability-unconfirmed', 'listing-age-over-90-days']);
  const sql = researchSql(rows);
  assert.match(sql, /insert into public.car_market_research/);
  assert.match(sql, /on conflict \(research_key\) do nothing/);
  assert.doesNotMatch(sql, /listing_observations|price_snapshots|published|accepted/);
});
test('research preserves unmatched identities and original mileage units', () => {
  const result = validate([{ ...row, vehicle_id: null, model: 'Highlander', model_year: 2018, mileage_value: 105862, mileage_unit: 'mi' }], sources, catalog(), now)[0];
  assert.equal(result.vehicle_id, null);
  assert.equal(result.mileage_value, 105862);
  assert.equal(result.mileage_unit, 'mi');
});
test('intake rejects wrong catalog year, model or source and stale observations', () => {
  for (const change of [{ model_year: 2018 }, { model: 'Camry' }, { listing_url: 'https://example.org.evil.test/cars/123' }, { listing_url: 'https://example.org/cars/123?phone=123' }, { observed_at: '2026-07-01T00:00:00Z' }, { listing_added_on: '2026-02-31' }, { mileage_value: 12 }, { quality_flags: ['approved'] }]) {
    assert.throws(() => validate([{ ...row, ...change }], sources, catalog(), now));
  }
  for (const access_status of ['blocked', 'retired']) assert.throws(() => validate([row], { test: { ...sources.test, access_status } }, catalog(), now));
});
test('duplicate observations and photo, VIN or contact payloads are rejected', () => {
  assert.throws(() => validate([row, row], sources, catalog(), now), /duplicate/);
  assert.throws(() => validate([row, { ...row, observed_at: '2026-10-01T17:00:00+01:00' }], sources, catalog(), now), /duplicate/);
  for (const key of ['seller_phone', 'seller_email', 'vin', 'image_url', 'review_status']) assert.throws(() => validate([{ ...row, [key]: 'private' }], sources, catalog(), now), /unsupported field/);
});
