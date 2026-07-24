'use strict';

const assert = require('assert');
const browserEngine = require('../../assets/js/engines/cv-paye');
const serverEngine = require('../../netlify/functions/_engines/cv-paye');

{
  const result = browserEngine.calculate({ grossMonthly: 0 });
  assert.equal(result.taxMonthly, 0);
  assert.equal(result.netMonthly, 0);
}

const taxFixtures = [
  [36606, 0],
  [36607, 100],
  [36608, 100],
  [80000, 6075],
  [80001, 6075],
  [150000, 20775],
  [150001, 20775],
  [200000, 33275]
];
for (const [grossMonthly, expectedTax] of taxFixtures) {
  assert.equal(browserEngine.taxMonthly(grossMonthly).tax, expectedTax, `${grossMonthly} monthly withholding`);
}

{
  const result = browserEngine.calculate({ grossMonthly: 80000 });
  assert.equal(result.taxMonthly, 6075);
  assert.equal(result.employeeInpsMonthly, 6800);
  assert.equal(result.netMonthly, 67125);
  assert.equal(result.employerInpsMonthly, 12800);
  assert.equal(result.employerCostMonthly, 92800);
}

{
  const result = browserEngine.calculate({ grossMonthly: 80000, regime: 'DOMESTIC' });
  assert.equal(result.employeeInpsMonthly, 6400);
  assert.equal(result.netMonthly, 67525);
  assert.equal(result.employerInpsMonthly, 12000);
  assert.equal(result.employerCostMonthly, 92000);
}

{
  const result = browserEngine.calculate({ grossMonthly: 80000, includeInps: false });
  assert.equal(result.employeeInpsMonthly, 0);
  assert.equal(result.netMonthly, 73925);
  assert.equal(result.employerCostMonthly, 80000);
}

{
  const result = serverEngine.calculate({ grossAnnual: 960000 });
  assert.equal(result.tax.netTax, 72900);
  assert.equal(result.deductions.inpsEmployee, 81600);
  assert.equal(result.result.netAnnual, 805500);
  assert.equal(result.result.netMonthly, 67125);
  assert.equal(result.employer.inpsEmployer, 153600);
  assert.equal(result.employer.totalCostAnnual, 1113600);
}

{
  const reverse = browserEngine.reverse({ netMonthly: 67125 });
  assert.ok(Math.abs(reverse.grossMonthly - 80000) < 0.02);
}

assert.equal(serverEngine.sourceCheckedOn, '2026-07-21');
console.log('Cape Verde PAYE official monthly formula fixtures passed.');
