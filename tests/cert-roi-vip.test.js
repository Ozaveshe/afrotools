'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/cert-roi/cert-roi-engine.js');

const base = {
  directCost: 1000,
  otherCost: 200,
  studyHours: 100,
  hourValue: 10,
  annualUplift: 1200,
  studyMonths: 6,
  delayMonths: 3,
  horizonYears: 3
};
const result = engine.calculate(base);
assert.equal(result.ok, true);
assert.equal(result.timeCost, 1000);
assert.equal(result.totalInvestment, 2200);
assert.equal(result.earningStartMonth, 9);
assert.equal(result.activeEarningMonths, 27);
assert.equal(result.monthlyUplift, 100);
assert.equal(result.grossUplift, 2700);
assert.equal(result.netGain, 500);
assert.equal(result.roiPercent, (500 / 2200) * 100);
assert.equal(result.paybackEarningMonths, 22);
assert.equal(result.calendarPaybackMonths, 31);
assert.equal(result.paysBackWithinHorizon, true);

const shortHorizon = engine.calculate({ ...base, horizonYears: 2 });
assert.equal(shortHorizon.activeEarningMonths, 15);
assert.equal(shortHorizon.grossUplift, 1500);
assert.equal(shortHorizon.netGain, -700);
assert.equal(shortHorizon.paysBackWithinHorizon, false);

const zeroBenefit = engine.calculate({ ...base, annualUplift: 0 });
assert.equal(zeroBenefit.grossUplift, 0);
assert.equal(zeroBenefit.netGain, -2200);
assert.equal(zeroBenefit.roiPercent, -100);
assert.equal(zeroBenefit.paybackEarningMonths, null);
assert.equal(zeroBenefit.calendarPaybackMonths, null);

const delayedBeyondHorizon = engine.calculate({ ...base, studyMonths: 24, delayMonths: 24, horizonYears: 3 });
assert.equal(delayedBeyondHorizon.activeEarningMonths, 0);
assert.equal(delayedBeyondHorizon.grossUplift, 0);

assert.equal(engine.calculate({ ...base, directCost: -1 }).ok, false);
assert.equal(engine.calculate({ ...base, horizonYears: 0 }).ok, false);
assert.equal(engine.calculate({ ...base, horizonYears: 11 }).ok, false);
assert.equal(engine.calculate({ ...base, studyMonths: 121 }).ok, false);
assert.equal(engine.calculate({ ...base, directCost: 0, otherCost: 0, studyHours: 0, hourValue: 0 }).ok, false);

console.log('cert-roi VIP engine tests: 27 assertions passed');
