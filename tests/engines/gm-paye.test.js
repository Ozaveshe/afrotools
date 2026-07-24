'use strict';

const assert = require('assert');
const engine = require('../../netlify/functions/_engines/gm-paye');
const browserEngine = require('../../assets/js/engines/gm-paye');

function calculate(grossAnnual, options = {}) {
  return engine.calculate({ grossAnnual, ...options });
}

{
  const result = calculate(0);
  assert.equal(result.tax.netTax, 0);
  assert.equal(result.deductions.totalDeductions, 0);
  assert.equal(result.result.netAnnual, 0);
  assert.equal(result.employer.totalCostAnnual, 0);
}

{
  const result = calculate(36000);
  assert.equal(result.tax.netTax, 0);
  assert.equal(result.deductions.npfEmployee, 1800);
  assert.equal(result.result.netAnnual, 34200);
  assert.equal(result.employer.iicf, 180);
}

{
  const result = calculate(46000);
  assert.equal(result.tax.netTax, 500);
  assert.equal(result.deductions.npfEmployee, 2300);
  assert.equal(result.result.netAnnual, 43200);
}

{
  const result = calculate(56000);
  assert.equal(result.tax.netTax, 1500);
  assert.equal(result.deductions.npfEmployee, 2800);
  assert.equal(result.result.netAnnual, 51700);
  assert.equal(result.employer.npfEmployer, 5600);
  assert.equal(result.employer.iicf, 180);
  assert.equal(result.employer.totalCostAnnual, 61780);
}

{
  const result = calculate(66000);
  assert.equal(result.tax.netTax, 3000);
  assert.equal(result.deductions.npfEmployee, 3300);
  assert.equal(result.result.netAnnual, 59700);
  assert.equal(result.employer.npfEmployer, 6600);
  assert.equal(result.employer.iicf, 180);
  assert.equal(result.employer.totalCostAnnual, 72780);
}

{
  const result = calculate(76000);
  assert.equal(result.tax.netTax, 5000);
  assert.equal(result.deductions.npfEmployee, 3800);
  assert.equal(result.result.netAnnual, 67200);
}

{
  const result = calculate(600000);
  assert.equal(result.tax.taxableIncome, 600000);
  assert.equal(result.tax.netTax, 136000);
  assert.equal(result.deductions.npfEmployee, 30000);
  assert.equal(result.result.netAnnual, 434000);
  assert.equal(result.result.netMonthly, 36167);
  assert.equal(result.employer.npfEmployer, 60000);
  assert.equal(result.employer.iicf, 180);
  assert.equal(result.employer.totalCostAnnual, 660180);
}

const boundaryFixtures = [
  [36001, 0.05],
  [46001, 500.10],
  [56001, 1500.15],
  [66001, 3000.20],
  [76001, 5000.25]
];
for (const [grossAnnual, expectedTax] of boundaryFixtures) {
  const result = browserEngine.calculate({ grossAnnual });
  assert.ok(Math.abs(result.payeAnnual - expectedTax) < 1e-8, `${grossAnnual} boundary tax`);
}

{
  const result = calculate(600000, { scheme: 'FPS' });
  assert.equal(result.tax.netTax, 136000);
  assert.equal(result.deductions.fpsEmployee, 0);
  assert.equal(result.result.netAnnual, 464000);
  assert.equal(result.employer.fpsEmployer, 90000);
  assert.equal(result.employer.totalCostAnnual, 690180);
}

{
  const result = calculate(600000, { iicf: false });
  assert.equal(result.employer.iicf, 0);
  assert.equal(result.employer.totalCostAnnual, 660000);
}

{
  const reverse = engine.reverseCalculate({ netAnnual: 434000 });
  assert.ok(Math.abs(reverse.input.grossAnnual - 600000) < 2);
}

assert.equal(engine.sourceCheckedOn, '2026-07-21');
assert.equal(engine.formulaParameters.payeBase, 'gross employment income; no deductions');
console.log('Gambia PAYE official annual fixtures passed.');
