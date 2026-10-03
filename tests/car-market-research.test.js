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

test('reconciled source scopes allow private facts while keeping observation intake and withdrawal gates', () => {
  const registry = require('../data/cars/market-source-registry.json').sources;
  const { validate: validateObservation, vehicleIds } = require('../scripts/car-market-evidence');
  for (const source_id of ['autochek-ng', 'beforward-jp', 'yallamotor-uae', 'jiji-ug', 'jiji-tz']) {
    const source = registry[source_id];
    const fact = { ...row, source_id, country_code: source.country_code, listing_url: `https://${source.domain}/cars/synthetic-policy-check` };
    assert.deepEqual(validate([fact], registry, catalog(), now)[0].quality_flags, ['availability-unconfirmed', 'listing-age-over-90-days']);
    const observation = { vehicle_id: fact.vehicle_id, source_id, listing_url: fact.listing_url, observed_at: fact.observed_at, country_code: fact.country_code, condition_label: fact.condition_label, asking_price: fact.asking_price, currency: fact.currency };
    assert.throws(() => validateObservation([observation], registry, vehicleIds(), now), /source not approved for intake/, source_id);
    assert.throws(() => validate([fact], { ...registry, [source_id]: { ...source, access_status: 'blocked' } }, catalog(), now), /source unavailable for research/, source_id);
    assert.throws(() => validate([{ ...fact, listing_url: `https://${source.domain}.example.org/cars/synthetic-policy-check` }], registry, catalog(), now), /invalid source URL/, source_id);
  }
});

test('registering Cars-ZM does not relax query or unknown-condition validation before its separate migration', () => {
  const registry = require('../data/cars/market-source-registry.json').sources;
  const fact = { ...row, source_id: 'cars-zambia-zm', country_code: 'ZM', listing_url: 'https://cars-zambia.com/listing.php?type=car&id=123' };
  assert.throws(() => validate([fact], registry, catalog(), now), /invalid source URL/);
  assert.throws(() => validate([{ ...fact, listing_url: 'https://cars-zambia.com/cars/synthetic-policy-check', condition_label: null }], registry, catalog(), now), /invalid condition/);
});
