const assert = require('assert');
const engine = require('../engines/src/gh-ssnit-engine.js');

assert.strictEqual(engine.pensionRight(179), 0);
assert.strictEqual(engine.pensionRight(180), 0.375);
assert.strictEqual(engine.pensionRight(181), 0.3759375);
assert.strictEqual(engine.pensionRight(240), 0.43125);
assert.strictEqual(engine.pensionRight(420), 0.60);
assert.strictEqual(engine.pensionRight(421), 0.60);

const base = {
  contributionDate: '2026-07-23',
  basicSalary: 5000,
  employeeCount: 1,
  averageBest36Monthly: 5000,
  contributionMonths: 240,
  retirementAge: 60
};
const standard = engine.calculate(base);
assert.strictEqual(standard.ok, true);
assert.deepStrictEqual(standard.perWorker, {
  employeeDeduction: 275,
  employerContribution: 650,
  tier1Remittance: 675,
  tier2Remittance: 250,
  totalContribution: 925
});
assert.strictEqual(standard.benefit.estimatedMonthlyPension, 2156.25);
assert.strictEqual(standard.benefit.status, 'full_pension_estimate');

const minimum = engine.calculate({ ...base, basicSalary: 100 });
assert.strictEqual(minimum.insurableSalary, 587.80);
assert.strictEqual(minimum.salaryAdjustment, 'minimum_applied');
for (const salary of [400, 587.80, 588]) {
  const estimate = engine.calculate({ ...base, basicSalary: salary, employeeCount: 2 });
  assert.strictEqual(estimate.perWorker.tier1Remittance, 79.40);
  assert.strictEqual(estimate.payroll.tier1Remittance, 158.80);
  assert.ok(estimate.tier1MinimumAdjustmentPerWorker > 0);
}
assert.strictEqual(engine.calculate({ ...base, basicSalary: 600 }).perWorker.tier1Remittance, 81);

const maximum = engine.calculate({ ...base, basicSalary: 100000, employeeCount: 2 });
assert.strictEqual(maximum.insurableSalary, 69000);
assert.strictEqual(maximum.payroll.totalContribution, 25530);

const early = engine.calculate({ ...base, retirementAge: 55 });
assert.strictEqual(early.benefit.baseBeforeEarlyReduction, 2156.25);
assert.strictEqual(early.benefit.estimatedMonthlyPension, null);
assert.strictEqual(early.benefit.status, 'early_reduction_required');

const short = engine.calculate({ ...base, contributionMonths: 179 });
assert.strictEqual(short.benefit.estimatedMonthlyPension, null);
assert.strictEqual(short.benefit.status, 'below_minimum_months');

for (const date of ['2026-11-19', '2026-12-31']) {
  assert.deepStrictEqual(engine.calculate({ ...base, contributionDate: date }).perWorker, standard.perWorker);
}
for (const date of ['2027-01-01', '2026-02-31']) {
  assert.strictEqual(engine.calculate({ ...base, contributionDate: date }).error, 'unsupported_date');
}
assert.strictEqual(engine.calculate({ ...base, contributionDate: '2025-12-31' }).error, 'unsupported_date');
assert.strictEqual(engine.calculate({ ...base, basicSalary: 0 }).error, 'invalid_salary');
assert.strictEqual(engine.calculate({ ...base, employeeCount: 1.5 }).error, 'invalid_employee_count');

const compatibility = globalThis.SSNITEngine.calcContributions(100000);
assert.strictEqual(compatibility.t1Emp, 3795);
assert.strictEqual(compatibility.totalEmployer, 8970);
assert.strictEqual(compatibility.nhiaIncludedInTier1, true);
assert.strictEqual(compatibility.nhia, compatibility.nhiaAllocation);
assert.strictEqual(compatibility.ssnitRetained + compatibility.nhiaAllocation, compatibility.t1Total);
assert.strictEqual(compatibility.t1Total + compatibility.tier2, compatibility.grandTotal);
assert.notStrictEqual(
  compatibility.t1Total + compatibility.tier2 + compatibility.nhia,
  compatibility.grandTotal
);
const compatibilityLow = globalThis.SSNITEngine.calcContributions(587.80);
assert(
  Math.abs(
    compatibilityLow.ssnitRetained +
      compatibilityLow.nhiaAllocation -
      compatibilityLow.t1Total
  ) < 0.001
);
assert.strictEqual(compatibilityLow.t1Total + compatibilityLow.tier2, compatibilityLow.grandTotal);

assert.strictEqual(compatibilityLow.t1Total, 79.40);
assert.strictEqual(globalThis.SSNITEngine.calcContributions(400).t1Total, 79.40);
assert.strictEqual(globalThis.SSNITEngine.calcContributions(0).t1Total, 0);
console.log('Ghana SSNIT engine checks passed');
