'use strict';
const assert = require('assert');
const engine = require('../assets/js/engines/rent-buy-scenario.js');

const result = engine.compare({
  horizonMonths: 60,
  confirmedInputs: true,
  rentUpfrontCash: 600000,
  rentMonthlyHousing: 250000,
  rentMonthlyOther: 20000,
  rentOtherOneOff: 100000,
  rentFinalCashReceived: 300000,
  buyUpfrontCash: 3000000,
  buyMonthlyHousing: 350000,
  buyMonthlyOther: 50000,
  buyOtherOneOff: 500000,
  buyFinalCashReceived: 10000000
});
assert.strictEqual(result.rent.grossCashOut, 16900000);
assert.strictEqual(result.rent.netCashCost, 16600000);
assert.strictEqual(result.buy.grossCashOut, 27500000);
assert.strictEqual(result.buy.netCashCost, 17500000);
assert.strictEqual(result.difference, 900000);
assert.strictEqual(result.lowerEnteredCashCost, 'rent');
assert.throws(() => engine.compare({ horizonMonths: 60, confirmedInputs: false }), /Confirm/);
assert.throws(() => engine.compare({ horizonMonths: 0, confirmedInputs: true }), /horizonMonths/);
assert.throws(() => engine.compare({
  horizonMonths: 12, confirmedInputs: true, rentUpfrontCash: -1
}), /rentUpfrontCash/);
assert.match(engine.formulaParameters.excludedAssumptions, /No appreciation/);
assert.match(engine.formulaParameters.decisionBoundary, /not a recommendation/);
console.log('rent-buy-scenario.test.js passed');
