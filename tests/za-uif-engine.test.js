'use strict';
const assert = require('assert');
const engine = require('../engines/src/za-uif-engine.js');

function close(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.01, `${label}: expected ${expected}, got ${actual}`);
}

const contribution = engine.calculateContribution({ monthlyRemuneration: 25000, employees: 8, months: 2 });
close(contribution.contributionBase, 17712, 'monthly ceiling');
close(contribution.employeeMonthly, 177.12, 'employee maximum');
close(contribution.employerMonthly, 177.12, 'employer maximum');
close(contribution.teamPeriodTotal, 5667.84, 'team period total');
assert.strictEqual(contribution.ceilingApplied, true);

const ceilingDailyIncome = 17712 * 12 / 365;
close(engine.calculateIncomeReplacementRate(ceilingDailyIncome), 0.38, 'IRR lower bound at ceiling');
close(engine.calculateIncomeReplacementRate(0), 0.60, 'IRR upper bound');

const firstTier = engine.calculateBenefitPlan({ averageMonthlyRemuneration: 17712, availableCreditDays: 238, requestedDays: 238 });
assert.strictEqual(firstTier.slidingTierDays, 238);
assert.strictEqual(firstTier.secondTierDays, 0);
close(firstTier.estimatedBenefit, ceilingDailyIncome * 0.38 * 238, 'first 238 days');

const tierBoundary = engine.calculateBenefitPlan({ averageMonthlyRemuneration: 17712, availableCreditDays: 365, requestedDays: 239 });
assert.strictEqual(tierBoundary.slidingTierDays, 238);
assert.strictEqual(tierBoundary.secondTierDays, 1);
close(tierBoundary.estimatedBenefit, ceilingDailyIncome * 0.38 * 238 + ceilingDailyIncome * 0.20, 'day 239 at 20%');

const fullCycle = engine.calculateBenefitPlan({ averageMonthlyRemuneration: 17712, availableCreditDays: 999, requestedDays: 999 });
assert.strictEqual(fullCycle.payableDays, 365);
assert.strictEqual(fullCycle.secondTierDays, 127);

const maternity = engine.calculateMaternityPlan({ averageMonthlyRemuneration: 12000, employerMonthlyPay: 0, requestedDays: 200 });
assert.strictEqual(maternity.payableDays, 121);
close(maternity.dailyBenefit, 12000 * 12 / 365 * 0.66, 'maternity 66%');
const maternityTopUp = engine.calculateMaternityPlan({ averageMonthlyRemuneration: 12000, employerMonthlyPay: 10000, requestedDays: 121 });
close(maternityTopUp.dailyBenefit, 2000 * 12 / 365, 'maternity combined-pay cap');
assert.strictEqual(maternityTopUp.topUpLimited, true);

const maternityAboveCeiling = engine.calculateMaternityPlan({ averageMonthlyRemuneration: 30000, employerMonthlyPay: 25000, requestedDays: 121 });
close(maternityAboveCeiling.dailyIncome, 17712 * 12 / 365, 'maternity capped benefit basis');
close(maternityAboveCeiling.normalDailyRemuneration, 30000 * 12 / 365, 'maternity actual normal remuneration');
close(maternityAboveCeiling.dailyBenefit, 5000 * 12 / 365, 'maternity above-ceiling top-up');
close(maternityAboveCeiling.estimatedBenefit, 5000 * 12 / 365 * 121, 'maternity above-ceiling total');

const aboveCeilingMaternity = engine.calculateMaternityPlan({ averageMonthlyRemuneration: 30000, employerMonthlyPay: 25000, requestedDays: 121 });
close(aboveCeilingMaternity.dailyBenefit, 5000 * 12 / 365, 'maternity top-up compares employer pay with actual normal remuneration');
close(aboveCeilingMaternity.estimatedBenefit, 5000 * 12 / 365 * 121, 'above-ceiling maternity total');
assert.strictEqual(aboveCeilingMaternity.topUpLimited, true);

assert.throws(() => engine.calculateContribution({ monthlyRemuneration: -1 }), RangeError);
console.log('za-uif-engine.test.js passed');
