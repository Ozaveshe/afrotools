const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const cp = require('node:child_process');
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
  const old = load(cp.execFileSync('git', ['show', 'bfee7e433282eb5ba786a8f3af241d109750166f:engines/src/water-bill-engine.js'], { encoding: 'utf8' }));
  for (const monthlyUsage of [0, 1, 15, 150]) for (const customerType of ['residential', 'commercial']) {
    const input = { monthlyUsage, customerType, householdSize: 4 };
    assert.equal(JSON.stringify(engine.calculate(input, 'NG')), JSON.stringify(old.calculate(input, 'NG')));
  }
});
test('generated Ethiopia page equals its route-specific source and cannot claim an official bill', () => {
  const page = fs.readFileSync('tools/water-bill/ethiopia/index.html', 'utf8');
  assert.equal(page, fs.readFileSync('scripts/templates/ethiopia-water-bill.html', 'utf8'));
  assert.doesNotMatch(page, /exact water bill|using official tariff rates|WHO Benchmark/);
});
