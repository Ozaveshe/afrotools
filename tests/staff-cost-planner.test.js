'use strict';
const assert = require('assert');
const engine = require('../engines/src/staff-cost-planner.js');

function valid() {
  return { currency: 'NGN', headcount: 5, horizonMonths: 12, monthlySalary: 500000, monthlyEmployerObligations: 60000, monthlyBenefits: 40000, monthlyOtherRecurring: 25000, recruitmentCost: 100000, equipmentCost: 350000, annualExtras: 500000, contingencyPercent: 5, sourceLabel: 'Current payroll adviser schedule', sourceCheckedDate: '2026-07-22', asOfDate: '2026-07-22', employeeStatusConfirmed: true, obligationEvidenceConfirmed: true };
}
function close(actual, expected, label) { assert.ok(Math.abs(actual - expected) <= 0.01, `${label}: expected ${expected}, got ${actual}`); }

const result = engine.calculate(valid());
close(result.perPerson.recurringMonthly, 625000, 'recurring per person');
close(result.teamRecurringMonthly, 3125000, 'team recurring monthly');
close(result.oneOffTeam, 2250000, 'team one-off cost');
close(result.annualExtrasForHorizon, 2500000, 'annual extras');
close(result.subtotal, 42250000, 'subtotal');
close(result.contingency, 2112500, 'contingency');
close(result.horizonTotal, 44362500, 'horizon total');
close(result.monthlyPlanningAverage, 3696875, 'monthly planning average');
close(result.loadPercent, 47.875, 'load above salary percentage');

const partial = valid(); partial.headcount = 2; partial.horizonMonths = 6; partial.annualExtras = 120000; partial.contingencyPercent = 0;
const partialResult = engine.calculate(partial);
close(partialResult.annualExtrasForHorizon, 120000, 'six-month annual extra proration');
close(partialResult.horizonTotal, 8520000, 'six-month two-person total');

const zeroExtras = valid(); Object.assign(zeroExtras, { monthlyEmployerObligations: 0, monthlyBenefits: 0, monthlyOtherRecurring: 0, recruitmentCost: 0, equipmentCost: 0, annualExtras: 0, contingencyPercent: 0, headcount: 1 });
close(engine.calculate(zeroExtras).horizonTotal, 6000000, 'salary-only budget');

assert.throws(() => engine.calculate({ ...valid(), employeeStatusConfirmed: false }), /reviewed as employment/);
assert.throws(() => engine.calculate({ ...valid(), obligationEvidenceConfirmed: false }), /current authority/);
assert.throws(() => engine.calculate({ ...valid(), sourceCheckedDate: '2025-07-20' }), /over one year old/);
assert.throws(() => engine.calculate({ ...valid(), sourceCheckedDate: '2026-07-23' }), /cannot be after/);
assert.throws(() => engine.calculate({ ...valid(), currency: 'naira' }), /three-letter/);
assert.throws(() => engine.calculate({ ...valid(), headcount: 1.5 }), /whole number/);
assert.throws(() => engine.calculate({ ...valid(), horizonMonths: 61 }), /1 to 60/);
assert.throws(() => engine.calculate({ ...valid(), monthlySalary: 0 }), /greater than zero/);
assert.throws(() => engine.calculate({ ...valid(), contingencyPercent: 101 }), /must not exceed/);
console.log('staff-cost-planner.test.js passed');
