'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/edu-savings/edu-savings-engine.js');

function near(actual, expected, tolerance = 1e-8) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} should be near ${expected}`);
}

const zeroGrowth = engine.calculate({
  todayCost: 10000,
  months: 12,
  inflationRate: 0,
  currentSavings: 1000,
  monthlyContribution: 500,
  annualGrowthRate: 0,
  timing: 'end'
});
assert.equal(zeroGrowth.ok, true);
assert.equal(zeroGrowth.years, 1);
assert.equal(zeroGrowth.futureCost, 10000);
assert.equal(zeroGrowth.currentSavingsFutureValue, 1000);
assert.equal(zeroGrowth.contributionFactor, 12);
assert.equal(zeroGrowth.contributionFutureValue, 6000);
assert.equal(zeroGrowth.projectedFund, 7000);
assert.equal(zeroGrowth.gap, 3000);
assert.equal(zeroGrowth.requiredMonthlyContribution, 750);
assert.equal(zeroGrowth.totalCashContributed, 7000);
assert.equal(zeroGrowth.nominalGrowthAmount, 0);

const inflation = engine.calculate({
  todayCost: 10000,
  months: 24,
  inflationRate: 10,
  currentSavings: 0,
  monthlyContribution: 100,
  annualGrowthRate: 0,
  timing: 'end'
});
near(inflation.futureCost, 12100);
assert.equal(inflation.contributionFutureValue, 2400);

const endFactor = engine.futureValueFactor(0.01, 12, 'end');
const beginningFactor = engine.futureValueFactor(0.01, 12, 'beginning');
assert.equal(engine.futureValueFactor(0, 12, 'beginning'), 12);
near(beginningFactor, endFactor * 1.01);
assert.ok(beginningFactor > endFactor);

const negativeGrowth = engine.calculate({
  todayCost: 10000,
  months: 12,
  inflationRate: 0,
  currentSavings: 1000,
  monthlyContribution: 0,
  annualGrowthRate: -12,
  timing: 'end'
});
near(negativeGrowth.currentSavingsFutureValue, 1000 * Math.pow(0.99, 12));
assert.ok(negativeGrowth.nominalGrowthAmount < 0);

const enoughOpeningSavings = engine.calculate({
  todayCost: 1000,
  months: 12,
  inflationRate: 0,
  currentSavings: 1000,
  monthlyContribution: 100,
  annualGrowthRate: 12,
  timing: 'end'
});
assert.equal(enoughOpeningSavings.requiredMonthlyContribution, 0);
assert.ok(enoughOpeningSavings.gap < 0);

assert.equal(engine.calculate({ ...zeroGrowth, todayCost: 0 }).ok, false);
assert.equal(engine.calculate({ ...zeroGrowth, months: 0 }).ok, false);
assert.equal(engine.calculate({ ...zeroGrowth, months: 12.5 }).ok, false);
assert.equal(engine.calculate({ ...zeroGrowth, months: 601 }).ok, false);
assert.equal(engine.calculate({ ...zeroGrowth, inflationRate: 101 }).ok, false);
assert.equal(engine.calculate({ ...zeroGrowth, annualGrowthRate: -51 }).ok, false);
assert.equal(engine.calculate({ ...zeroGrowth, currentSavings: -1 }).ok, false);

console.log('edu-savings VIP engine tests: 27 assertions passed');
