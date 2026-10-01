const assert = require('node:assert/strict');
const { test } = require('node:test');
const { validate, intakeSql, vehicleIds } = require('../scripts/car-market-evidence');

const now = new Date('2026-10-01T12:00:00Z');
const sources = { 'approved-test': { domain: 'example.org', access_status: 'automated-approved' }, blocked: { domain: 'example.org', access_status: 'blocked' } };
const fixture = {
  vehicle_id: 'toyota-camry-2005', source_id: 'approved-test',
  listing_url: 'https://example.org/cars/123#details', observed_at: '2026-10-01T11:00:00Z',
  country_code: 'NG', condition_label: 'foreign-used', asking_price: 4200000,
  currency: 'NGN', market: "Lagos' Island", mileage_km: 128000
};

test('catalog identities include the full deduplicated 482', () => assert.equal(vehicleIds().size, 482));
test('valid listing becomes pending and retains a source URL', () => {
  const rows = validate([fixture], sources, vehicleIds(), now);
  assert.equal(rows[0].review_status, 'pending');
  assert.equal(rows[0].listing_url, 'https://example.org/cars/123');
  assert.match(intakeSql(rows), /Lagos'' Island/);
  assert.doesNotMatch(intakeSql(rows), /published/);
});
test('rejects blocked sources, outside domains, stale observations and duplicate listings', () => {
  for (const change of [
    { source_id: 'blocked' },
    { listing_url: 'https://example.org.evil.test/cars/123' },
    { observed_at: '2026-08-01T11:00:00Z' }
  ]) assert.throws(() => validate([{ ...fixture, ...change }], sources, vehicleIds(), now));
  assert.throws(() => validate([fixture, fixture], sources, vehicleIds(), now), /duplicate/);
});
test('rejects seller contact or image payloads', () => {
  assert.throws(() => validate([{ ...fixture, seller_phone: '123' }], sources, vehicleIds(), now), /unsupported field/);
});

test('refresh updates identity and comparable facts, and ignores older observations', () => {
  const sql = intakeSql(validate([fixture], sources, vehicleIds(), now));
  for (const field of ['vehicle_id', 'country_code', 'condition_label', 'trim_label', 'engine_cc', 'currency']) {
    assert.ok(sql.includes(`${field} = excluded.${field}`), `${field} must refresh`);
  }
  assert.match(sql, /excluded.observed_at > car_market_listing_observations.observed_at/);
});

test('engine validation matches the live database bounds', () => {
  for (const engine_cc of [0, 99, 12001, 1800.5]) {
    assert.throws(() => validate([{ ...fixture, engine_cc }], sources, vehicleIds(), now), /invalid engine_cc/);
  }
});
