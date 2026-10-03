const assert = require('node:assert/strict');
const { test } = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const { loadCatalog, mergeCatalog } = require('../scripts/car-market-catalog');
const { seedSql } = require('../scripts/build-car-market-vehicle-seed');
const { catalog, validate } = require('../scripts/car-market-research');
const identity = { vehicle_id: 'toyota-camry-2013', make: 'Toyota', make_slug: 'toyota', model: 'Camry', model_slug: 'camry', year: '2013', body_type: 'sedan', catalog_status: 'active' };
const addition = { ...identity, identity_evidence_url: 'https://example.org/manufacturer', market_listing_url: 'https://example.org/car', reviewed_at: '2026-10-02' };

test('all pre-existing IDs survive and evidenced additions have no valuation fields', () => {
  const rows = loadCatalog();
  const ids = new Set(rows.map(row => row.vehicle_id));
  const baseline = new Set();
  for (const file of ['master-vehicle-catalog.csv', 'import-duty-vehicle-estimates.csv']) {
    for (const line of fs.readFileSync(path.join(__dirname, '../data/cars', file), 'utf8').split(/\r?\n/).slice(1)) if (line) baseline.add(line.split(',')[0]);
  }
  assert.ok(baseline.size >= 482);
  for (const id of baseline) assert.ok(ids.has(id), id);
  const additionCount = fs.readFileSync(path.join(__dirname, '../data/cars/market-identity-additions.csv'), 'utf8').trim().split(/\r?\n/).length - 1;
  assert.equal(ids.size, baseline.size + additionCount);
  for (const row of rows) assert.ok(Object.keys(row).every(field => !field.includes('price')));
});

test('conflicting or colliding identity additions are refused', () => {
  assert.throws(() => mergeCatalog([identity], [{ ...addition, year: '2014' }]), /identity year/);
  assert.throws(() => mergeCatalog([identity], [{ ...addition, vehicle_id: 'toyota-camry-le-2013' }]), /another ID/);
  assert.throws(() => mergeCatalog([identity], [addition]), /already present/);
  assert.throws(() => mergeCatalog([identity, { ...identity, body_type: 'suv' }]), /conflicting/);
});

test('identity-only additions reject prices and unsafe evidence', () => {
  for (const change of [{ price_median_usd: '10000' }, { market_listing_url: 'https://example.org/car?phone=123' }, { identity_evidence_url: 'javascript:alert(1)' }, { reviewed_at: '2026-02-30' }]) assert.throws(() => mergeCatalog([], [{ ...addition, ...change }]));
});

test('catalog evidence permits only the canonical Cars-ZM public car reference', () => {
  const url = 'https://cars-zambia.com/listing.php?type=car&id=421';
  assert.equal(mergeCatalog([], [{ ...addition, market_listing_url: url }]).length, 1);
  for (const bad of [
    url + '&phone=123', url + '&id=422', url + '#seller',
    url.replace('type=car', 'type=person'), url.replace('id=421', 'id=0'),
    url.replace('id=421', 'id=0421'), url.replace('id=421', 'id=12345678901'),
    url.replace('type=car&id=421', 'id=421&type=car'),
    url.replace('cars-zambia.com', 'cars-zambia.com.example.org'),
    url.replace('cars-zambia.com', 'www.cars-zambia.com'),
    url.replace('listing.php', 'profile.php'), url.replace('https:', 'http:'),
    url.replace('cars-zambia.com', 'user:pass@cars-zambia.com'),
    url.replace('cars-zambia.com', 'cars-zambia.com:443'),
    'https://example.org/car?type=car&id=421'
  ]) assert.throws(() => mergeCatalog([], [{ ...addition, market_listing_url: bad }]), /evidence URLs/, bad);
  assert.throws(() => mergeCatalog([], [{ ...addition, identity_evidence_url: url }]), /evidence URLs/);
});

test('new year and LX570 alias resolve to exact research identities', () => {
  const base = { source_id: 'test', listing_url: 'https://example.org/car', observed_at: '2026-10-02T05:00:00Z', make: 'Toyota', model: 'Camry', model_year: 2013, country_code: 'NG', market: 'Lagos', condition_label: 'foreign-used', asking_price: 12500000, currency: 'NGN', verification_level: 'detail-page-checked' };
  const sources = { test: { domain: 'example.org', access_status: 'review-needed' } };
  const now = new Date('2026-10-02T05:01:00Z');
  assert.equal(validate([{ ...base, vehicle_id: 'toyota-camry-2013' }], sources, catalog(), now)[0].vehicle_id, 'toyota-camry-2013');
  assert.equal(validate([{ ...base, vehicle_id: 'lexus-lx-2018', make: 'Lexus', model: 'LX570', model_year: 2018 }], sources, catalog(), now)[0].vehicle_id, 'lexus-lx-2018');
  assert.throws(() => validate([{ ...base, vehicle_id: 'toyota-camry-2013', model_year: 2012 }], sources, catalog(), now), /identity mismatch/);
});

test('seed only includes selected identities, stays bounded and carries no prices', () => {
  const sql = seedSql([identity]);
  assert.match(sql, /toyota-camry-2013/);
  assert.doesNotMatch(sql, /asking_price|price_min|price_median|price_max/);
  assert.throws(() => seedSql([]), /1..100/);
  assert.throws(() => seedSql(Array(101).fill(identity)), /1..100/);
  assert.throws(() => seedSql([{ ...identity, year: '2013); drop table x' }]), /identity year/);
});

test('Land Cruiser Prado matches existing Prado years without merging Land Cruiser', () => {
  const vehicles = catalog();
  const prados = [...vehicles.values()].filter(vehicle => vehicle.model_slug === 'prado');
  assert.equal(prados.length, 9);
  const base = { source_id: 'test', listing_url: 'https://example.org/prado', observed_at: '2026-10-02T05:00:00Z', make: 'Toyota', model: 'Land Cruiser Prado', country_code: 'KE', market: 'Nairobi', condition_label: 'foreign-used', asking_price: 6500000, currency: 'KES', verification_level: 'detail-page-checked' };
  const sources = { test: { domain: 'example.org', access_status: 'review-needed' } };
  const now = new Date('2026-10-02T05:01:00Z');
  for (const vehicle of prados) {
    const input = { ...base, vehicle_id: vehicle.vehicle_id, model_year: Number(vehicle.year) };
    assert.equal(validate([input], sources, vehicles, now)[0].vehicle_id, vehicle.vehicle_id);
    assert.equal(validate([{ ...input, model: 'Prado' }], sources, vehicles, now)[0].vehicle_id, vehicle.vehicle_id);
    for (const model of ['Land Cruiser', 'Land Cruiser 250', 'Prado TX']) {
      assert.throws(() => validate([{ ...input, model }], sources, vehicles, now), /identity mismatch/);
    }
    assert.throws(() => validate([{ ...input, model_year: Number(vehicle.year) + 1 }], sources, vehicles, now), /identity mismatch/);
  }
  assert.throws(() => validate([{ ...base, vehicle_id: 'toyota-land-cruiser-2016', model_year: 2016 }], sources, vehicles, now), /identity mismatch/);
  assert.equal(vehicles.get('toyota-land-cruiser-2016').model, 'Land Cruiser');
});
