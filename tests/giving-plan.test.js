'use strict';
const assert = require('assert');
const engine = require('../assets/js/engines/giving-plan.js');
const result = engine.plan({
  referenceAmount: 500000,
  chosenRatePercent: 8,
  additionalOffering: 10000,
  pledgeGoal: 120000,
  pledgePeriods: 6,
  essentialCosts: 300000,
  confirmedChoice: true
});
assert.strictEqual(result.percentageContribution, 40000);
assert.strictEqual(result.pledgePerPeriod, 20000);
assert.strictEqual(result.plannedContribution, 70000);
assert.strictEqual(result.remainingAfterEssentials, 200000);
assert.strictEqual(result.remainingAfterPlan, 130000);
assert.strictEqual(result.plannedShareOfReference, .14);
assert.throws(() => engine.plan({ confirmedChoice: false }), /Confirm/);
assert.throws(() => engine.plan({
  referenceAmount: 1,
  chosenRatePercent: 101,
  additionalOffering: 0,
  pledgeGoal: 0,
  pledgePeriods: 1,
  essentialCosts: 0,
  confirmedChoice: true
}), /chosenRatePercent/);
assert.match(engine.formulaParameters.faithBoundary, /No percentage/);
assert.match(engine.formulaParameters.claimBoundary, /No prosperity/);
console.log('giving-plan.test.js passed');
