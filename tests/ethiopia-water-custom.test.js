const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { normalizeReleaseOwnedHtml } = require('../scripts/lib/release-owned-html-normalizer');
function load(code) {
  const context = { window: {}, ENERGY_DATA: { countries: { NG: { name: 'Nigeria', currencySymbol: '₦', water: { residential: 200, commercial: 400 } } } } };
  vm.runInNewContext(code, context);
  return context.window.AfroTools.WaterBillEngine;
}
const engine = load(fs.readFileSync('engines/src/water-bill-engine.js', 'utf8'));
test('Ethiopia explicit flat-rate arithmetic preserves cents and charges', () => {
  const r = engine.calculate({ monthlyUsage: 15, householdSize: 4, customRate: 12.5, customFee: 7.25 }, 'ET');
  assert.equal(r.monthlyBill, 'ETB 194.75'); // 15 × 12.50 + 7.25; no implicit surcharge.
  assert.equal(r.dailyUsageLitres, '500.0 L');
  assert.equal(r.perPersonPerDay, '125.0 L/person');
  assert.equal(engine.calculate({ monthlyUsage: 15, householdSize: 4, customRate: 12.5, customFee: 0 }, 'ET').monthlyBill, 'ETB 187.50');
});
test('Ethiopia refuses missing, negative, fractional household and non-finite inputs', () => {
  const valid = { monthlyUsage: 15, householdSize: 4, customRate: 12.5, customFee: 0 };
  for (const key of Object.keys(valid)) for (const value of ['', undefined, Infinity, NaN, -1]) {
    assert.ok(engine.calculate({ ...valid, [key]: value }, 'ET').error, `${key}: ${value}`);
  }
  assert.ok(engine.calculate({ ...valid, householdSize: 1.5 }, 'ET').error);
});
test('other-market behavior matches the verified base for residential/commercial fixtures', () => {
  // Capture provenance and expected outputs in the fixture so this regression
  // remains reproducible in CI's shallow checkout without repository history.
  const baseline = JSON.parse(fs.readFileSync('tests/fixtures/water-bill-legacy-ng.json', 'utf8'));
  assert.equal(baseline.cases.length, 8);
  for (const fixture of baseline.cases) {
    assert.deepEqual(JSON.parse(JSON.stringify(engine.calculate(fixture.input, baseline.country))), fixture.expected);
  }
});
test('generated Ethiopia page equals its route-specific source and cannot claim an official bill', () => {
  const page = fs.readFileSync('tools/water-bill/ethiopia/index.html', 'utf8');
  // Release generation adds content-hash URLs and sitewide runtime hooks.
  // Keep all product copy, controls, source scripts and configuration exact.
  assert.equal(normalizeReleaseOwnedHtml(page), normalizeReleaseOwnedHtml(fs.readFileSync('scripts/templates/ethiopia-water-bill.html', 'utf8')));
  assert.doesNotMatch(page, /exact water bill|using official tariff rates|WHO Benchmark/);
});
