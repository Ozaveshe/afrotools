'use strict';
const assert = require('assert');
const engine = require('../assets/js/engines/sw-zakat.js');

const fixture = {
  currency: 'KES', nisabBasis: 'silver', cash: 100000, savings: 200000,
  goldGrams: 2, goldPrice: 9500, silverGrams: 10, silverPrice: 100,
  inventory: 50000, investments: 30000, receivables: 20000, debts: 40000,
  customNisab: 0, hawlDate: '2026-08-30', hawlMet: true
};
const result = engine.calculate(fixture);
assert.strictEqual(result.assets.goldValue, 19000);
assert.strictEqual(result.assets.silverValue, 1000);
assert.strictEqual(result.grossAssets, 420000);
assert.strictEqual(result.zakatableWealth, 380000);
assert.strictEqual(result.nisab, 59500);
assert.strictEqual(result.aboveNisab, true);
assert.strictEqual(result.zakatDue, 9500);

assert.strictEqual(engine.calculate({ ...fixture, hawlMet: false }).zakatDue, 0);
assert.strictEqual(engine.calculate({ ...fixture, cash: 1000, savings: 0, goldGrams: 0, silverGrams: 0, inventory: 0, investments: 0, receivables: 0, debts: 5000 }).zakatableWealth, 0);
assert.strictEqual(engine.calculate({ ...fixture, nisabBasis: 'gold' }).nisab, 807500);
assert.strictEqual(engine.calculate({ ...fixture, nisabBasis: 'custom', customNisab: 400000 }).aboveNisab, false);
assert.throws(() => engine.calculate({ ...fixture, cash: -1 }), error => error.code === 'INVALID_AMOUNT' && error.field === 'cash');
assert.throws(() => engine.calculate({ ...fixture, nisabBasis: 'silver', silverPrice: 0 }), error => error.code === 'ZERO_PRICE' && error.field === 'silverPrice');
assert.throws(() => engine.calculate({ ...fixture, nisabBasis: 'custom', customNisab: 0 }), error => error.code === 'ZERO_NISAB');
assert.match(engine.formula, /short-term debts/);
assert.strictEqual(engine.sourceReviewedOn, '2026-05-16');
console.log('sw-zakat.test.js passed: 14 assertions');
