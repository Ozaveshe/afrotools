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

test('unknown private condition stays null and cannot approve an observation', () => {
  for (const condition_label of [null, undefined]) {
    const result = validate([{ ...row, condition_label }], sources, catalog(), now)[0];
    assert.equal(result.condition_label, null);
    assert.ok(result.quality_flags.includes('availability-unconfirmed'));
    assert.doesNotMatch(researchSql([result]), /listing_observations|price_snapshots|published|accepted/);
  }
  for (const condition_label of ['', 'used', 'unknown', 'approved']) {
    assert.throws(() => validate([{ ...row, condition_label }], sources, catalog(), now), /invalid condition/);
  }
});

const zmSources = { zm: { domain: 'cars-zambia.com', access_status: 'review-needed', listing_url_policy: 'cars-zm-public-reference-v1' } };
const zmRow = { ...row, source_id: 'zm', listing_url: 'https://cars-zambia.com/listing.php?type=car&id=425', country_code: 'ZM', currency: 'ZMW', market: 'Lusaka', condition_label: null };

test('explicit Zambian public advert references canonicalize without accepting tracking data', () => {
  const canonical = validate([zmRow], zmSources, catalog(), now)[0];
  const reordered = validate([{ ...zmRow, listing_url: 'https://cars-zambia.com/listing.php?id=425&type=car' }], zmSources, catalog(), now)[0];
  assert.equal(reordered.listing_url, zmRow.listing_url);
  assert.equal(reordered.research_key, canonical.research_key);
  assert.throws(() => validate([zmRow, { ...zmRow, listing_url: reordered.listing_url }], zmSources, catalog(), now), /duplicate/);
  assert.throws(() => validate([zmRow], { zm: { ...zmSources.zm, listing_url_policy: undefined } }, catalog(), now), /invalid source URL/);
});

test('query exception rejects extra keys, duplicate keys, wrong endpoints and unsafe references', () => {
  for (const listing_url of [
    'https://cars-zambia.com/listing.php',
    'https://cars-zambia.com/cars/425',
    'https://cars-zambia.com/listing.php?type=car&id=',
    'http://cars-zambia.com/listing.php?type=car&id=425',
    'https://cars-zambia.com.evil.test/listing.php?type=car&id=425',
    'https://www.cars-zambia.com/listing.php?type=car&id=425',
    'https://cars-zambia.com/search.php?type=car&id=425',
    'https://cars-zambia.com/listing.php?type=part&id=425',
    'https://cars-zambia.com/listing.php?type=car&id=425&phone=123',
    'https://cars-zambia.com/listing.php?type=car&id=425&utm_source=test',
    'https://cars-zambia.com/listing.php?type=car&id=425&id=426',
    'https://cars-zambia.com/listing.php?type=car&type=car&id=425',
    'https://cars-zambia.com/listing.php?type=car',
    'https://cars-zambia.com/listing.php?type=car&id=0',
    'https://cars-zambia.com/listing.php?type=car&id=-1',
    'https://cars-zambia.com/listing.php?type=car&id=425.5',
    'https://cars-zambia.com/listing.php?type=car&id=000425',
    'https://cars-zambia.com/listing.php?type=car&id=12345678901',
    'https://cars-zambia.com/listing.php?type=car&id=person@example.org',
    'https://cars-zambia.com/listing.php?type=car&id=425#phone=123',
    'https://person:secret@cars-zambia.com/listing.php?type=car&id=425',
    'https://cars-zambia.com:8443/listing.php?type=car&id=425'
  ]) assert.throws(() => validate([{ ...zmRow, listing_url }], zmSources, catalog(), now), /invalid source URL/);
  for (const access_status of ['blocked', 'retired']) {
    assert.throws(() => validate([zmRow], { zm: { ...zmSources.zm, access_status } }, catalog(), now), /source unavailable/);
  }
});

test('unknown condition remains refused by approved observation and public snapshot paths', () => {
  const { validate: validateObservation, vehicleIds } = require('../scripts/car-market-evidence');
  const { snapshotSql } = require('../scripts/car-market-snapshot-sql');
  const { exportCapture } = require('../scripts/car-market-public-export');
  const approved = { dealer: { domain: 'example.org', access_status: 'manual-only' } };
  const observation = { source_id: 'dealer', listing_url: 'https://example.org/car', vehicle_id: row.vehicle_id, observed_at: row.observed_at, country_code: 'NG', currency: 'NGN', asking_price: row.asking_price, condition_label: null };
  assert.throws(() => validateObservation([observation], approved, vehicleIds(), now), /condition_label required/);
  assert.throws(() => snapshotSql({ vehicleId: row.vehicle_id, countryCode: 'NG', condition: null, currency: 'NGN' }), /Invalid condition/);
  const capture = { project_ref: 'zpclagtgczsygrgztlts', queried_at: now.toISOString(), snapshots: [{ snapshot_id: 'synthetic-null-condition', vehicle_id: row.vehicle_id, country_code: 'NG', currency: 'NGN', condition_label: null, status: 'published', reviewed_at: row.observed_at, published_at: row.observed_at }] };
  const result = exportCapture(capture, { sources: approved }, { now, vehicles: new Set([row.vehicle_id]) });
  assert.equal(result.publicPack.observations.length, 0);
  assert.equal(result.excluded.length, 1);
  assert.match(result.excluded[0].reason, /Invalid comparable identity/);
});
