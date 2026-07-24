'use strict';
const assert = require('assert');
const engine = require('../engines/src/pension-projection-planner');

const base = {
  currency: 'NGN', currentBalance: 1000000, monthlyPersonal: 50000, monthlyEmployer: 50000,
  monthlyVoluntary: 0, years: 1, annualReturnPercent: 12, annualFeePercent: 0,
  inflationPercent: 6, contributionGrowthPercent: 0, sourceLabel: 'Current provider statement',
  sourceCheckedDate: '2026-07-22', asOfDate: '2026-07-22', schemeInputsConfirmed: true,
  assumptionsConfirmed: true
};

const result = engine.calculate(base);
assert.ok(Math.abs(result.base.endingBalance - 2384649.7908353196) < 0.000001);
assert.strictEqual(result.base.futureContributions, 1200000);
assert.ok(Math.abs(result.base.investmentGrowth - 184649.79083531955) < 0.000001);
assert.ok(Math.abs(result.base.realValue - 2249669.613995584) < 0.000001);
assert.ok(result.lower.endingBalance < result.base.endingBalance);
assert.ok(result.higher.endingBalance > result.base.endingBalance);
assert.throws(() => engine.calculate({ ...base, schemeInputsConfirmed: false }), /Confirm that the balance/);
assert.throws(() => engine.calculate({ ...base, sourceCheckedDate: '2025-01-01' }), /more than 366 days old/);
assert.throws(() => engine.calculate({ ...base, currency: 'N' }), /three-letter ISO/);
console.log('pension-projection-planner.test.js passed');
