'use strict';
const assert = require('assert');
const engine = require('../engines/src/crypto-cgt-engine.js');

function base(country, disposalDate) {
  return { country, disposalDate, taxpayerType: 'individual', classification: 'capital-confirmed', scopeConfirmed: true, proceeds: 0, acquisitionCost: 0, acquisitionCosts: 0, disposalCosts: 0 };
}
function close(actual, expected, label) { assert.ok(Math.abs(actual - expected) <= 0.01, `${label}: expected ${expected}, got ${actual}`); }

let value = Object.assign(base('NG', '2026-06-01'), { proceeds: 20000000, acquisitionCost: 10000000, disposalCosts: 1000000, otherChargeableIncome: 0 });
close(engine.calculate(value).estimatedTax, 1410000, 'Nigeria progressive incremental tax');
value.otherChargeableIncome = 3000000;
close(engine.calculate(value).estimatedTax, 1620000, 'Nigeria gain after prior income fills lower bands');

value = Object.assign(base('KE', '2026-06-01'), { proceeds: 10000000, acquisitionCost: 4000000, disposalCosts: 500000 });
close(engine.calculate(value).estimatedTax, 825000, 'Kenya confirmed capital gain');

value = Object.assign(base('ZA', '2026-06-01'), { proceeds: 2500000, acquisitionCost: 1750000, otherCapitalGains: 0, currentCapitalLosses: 0, assessedCapitalLoss: 0, otherTaxableIncome: 500000 });
const za = engine.calculate(value);
close(za.taxableBase, 280000, 'South Africa 40 percent inclusion after exclusion');
close(za.estimatedTax, 101816, 'South Africa incremental individual tax');

value = Object.assign(base('GH', '2026-06-01'), { proceeds: 300000, acquisitionCost: 190000, disposalCosts: 10000 });
close(engine.calculate(value).estimatedTax, 15000, 'Ghana isolated capital gain');

value = Object.assign(base('KE', '2026-06-01'), { proceeds: 100, acquisitionCost: 150 });
const loss = engine.calculate(value);
assert.strictEqual(loss.estimatedTax, 0);
assert.strictEqual(loss.capitalLoss, 50);

assert.throws(() => engine.calculate(Object.assign(base('NG', '2026-06-01'), { classification: 'uncertain' })), /No estimate produced/);
assert.throws(() => engine.calculate(Object.assign(base('GH', '2026-06-01'), { classification: 'mining-staking-reward' })), /No estimate produced/);
assert.throws(() => engine.calculate(Object.assign(base('KE', '2026-06-01'), { taxpayerType: 'company' })), /individuals only/);
assert.throws(() => engine.calculate(Object.assign(base('ZA', '2026-02-28'))), /supported 2027 year of assessment/);
assert.throws(() => engine.calculate(Object.assign(base('NG', '2027-01-01'))), /supported 2026 calendar year/);
assert.throws(() => engine.calculate(Object.assign(base('UG', '2026-06-01'))), /Choose Nigeria/);
assert.throws(() => engine.calculate(Object.assign(base('GH', '2026-06-01'), { scopeConfirmed: false })), /Confirm the scope/);
console.log('crypto-cgt-engine.test.js passed');
