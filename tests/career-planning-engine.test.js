'use strict';
const assert = require('assert');
const engine = require('../assets/js/engines/career-planning.js');

function close(actual, expected, tolerance = 1e-6) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} != ${expected}`);
}

const growth = engine.careerGrowth({
  country: 'NG', industry: 'tech', level: 2, salary: 0, experience: 5,
  education: 'degree', path: 'ic', learning: '2', network: 'medium', mobility: 'sometimes'
});
assert.strictEqual(growth.startSalary, 369600);
close(growth.fiveYearSalary, 1171560.771292286);
close(growth.tenYearSalary, 3640552.915012716);
close(growth.cumulativeEarnings, 198566466.4816687);
assert.deepStrictEqual(growth.milestones.map((item) => [item.year, item.type]), [
  [3, 'promotion'], [4, 'move'], [7, 'promotion'], [8, 'move']
]);

const careerSwitch = engine.careerSwitch({
  currency: 'NGN', currentSalary: 300000, currentBenefits: 30000,
  newSalary: 500000, retrainingCost: 600000, retrainingMonths: 6,
  searchMonths: 3, partTimeIncome: 0.5, growthRate: 8, satisfaction: 5
});
assert.strictEqual(careerSwitch.totalCost, 2580000);
assert.strictEqual(careerSwitch.monthlyGain, 170000);
assert.strictEqual(careerSwitch.breakEven, 16);
close(careerSwitch.projectionRows[4].difference, 10842243.914547354);

const retirement = engine.retirement({
  country: 'NG', age: 35, retirementAge: 60, savings: 3000000,
  contribution: 100000, salary: 500000, pensionPayout: 0, expenses: 350000
});
assert.strictEqual(retirement.target, 105000000);
close(retirement.projected, 50945840.97938814);
assert.strictEqual(retirement.score, 49);
close(retirement.extraContribution, 121195.54013483338);

assert.deepStrictEqual(engine.salaryNegotiation({
  country: 'NG', experience: 5, benchmark: 500000, current: 0, offer: 450000
}), {
  symbol: '₦', lower: 450000, median: 500000, upper: 550000,
  counter: 525000, comparison: 'below-midpoint'
});

assert.throws(() => engine.careerGrowth({
  country: 'NG', industry: 'tech', level: 2, salary: -1, experience: 5,
  education: 'degree', path: 'ic', learning: '2', network: 'medium', mobility: 'no'
}), /invalid:salary/);
assert.throws(() => engine.careerSwitch({
  currency: 'NGN', currentSalary: 1, currentBenefits: 0, newSalary: 1,
  retrainingCost: 0, retrainingMonths: 49, searchMonths: 0,
  partTimeIncome: 0, growthRate: 0, satisfaction: 5
}), /invalid:retrainingMonths/);
assert.throws(() => engine.retirement({
  country: 'NG', age: 60, retirementAge: 60, savings: 0,
  contribution: 0, salary: 0, pensionPayout: 0, expenses: 1
}), /invalid:retirementAge/);
assert.throws(() => engine.salaryNegotiation({
  country: 'NG', experience: 41, benchmark: 1, current: 0, offer: 0
}), /invalid:experience/);

console.log('Career planning engine: 4 owner oracles and 4 invalid boundaries passed.');
