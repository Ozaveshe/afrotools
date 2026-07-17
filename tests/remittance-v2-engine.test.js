const assert = require('assert');
const engine = require('../assets/js/engines/remittance-v2.js');

function approx(actual, expected, tolerance, message) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${message}: expected ${expected}, got ${actual}`);
}

const referenceRate = engine.getReferenceRate('US', 'NG');
assert.strictEqual(referenceRate, 1535);

const result = engine.compare({
  sendCountry: 'US',
  receiveCountry: 'NG',
  amount: 500,
  referenceRate,
  scenarios: [
    { name: 'Fast wallet', providerType: 'mobile', delivery: 'mobile', fee: 2, quotedRate: 1510, speedHours: 1 },
    { name: 'Cheap bank', providerType: 'fintech', delivery: 'bank', fee: 1, quotedRate: 1525, speedHours: 24 },
    { name: 'Cash pickup', providerType: 'cash', delivery: 'cash', fee: 15, quotedRate: 1480, speedHours: 2 }
  ]
});

assert.strictEqual(result.scenarios.length, 3);
assert.strictEqual(result.cheapest.name, 'Cheap bank');
assert.strictEqual(result.fastest.name, 'Fast wallet');
assert.strictEqual(result.bestRecipient.name, 'Cheap bank');
approx(result.cheapest.recipientAmount, 760975, 0.01, 'recipient amount includes fee and quoted rate');
approx(result.cheapest.totalCostSend, 4.25, 0.01, 'total cost converts recipient shortfall back to send currency');
approx(result.cheapest.fxMarginPct, 0.65, 0.01, 'fx margin compares quoted rate with reference rate');
approx(result.cheapest.effectiveRate, 1521.95, 0.01, 'effective rate includes fee drag');
assert.ok(result.scenarios.find((row) => row.name === 'Cash pickup').warnings.some((warning) => warning.includes('Cash pickup')));

const defaults = engine.createDefaultScenarios(500, referenceRate);
assert.strictEqual(defaults.length, 4);
assert.ok(defaults.every((scenario) => scenario.quotedRate > 0 && scenario.fee >= 0));

console.log('remittance-v2 engine tests passed');
