'use strict';

const assert = require('assert');
const browserEngine = require('../../assets/js/engines/st-paye');
const serverEngine = require('../../netlify/functions/_engines/st-paye');

{
  const result = browserEngine.calculate({ grossMonthly: 0 });
  assert.equal(result.ok, true);
  assert.equal(result.employeeInssMonthly, 0);
  assert.equal(result.employerInssMonthly, 0);
  assert.equal(result.afterEmployeeInssMonthly, 0);
  assert.equal(result.irsMonthly, null);
  assert.equal(result.netMonthly, null);
}

{
  const result = browserEngine.calculate({ grossMonthly: 10000 });
  assert.equal(result.employeeInssMonthly, 400);
  assert.equal(result.employerInssMonthly, 600);
  assert.equal(result.afterEmployeeInssMonthly, 9600);
  assert.equal(result.employerCostMonthly, 10600);
  assert.equal(result.irsStatus, 'CURRENT_SCHEDULE_UNCONFIRMED');
}

{
  const result = browserEngine.calculate({ grossMonthly: 12345.67 });
  assert.equal(result.employeeInssMonthly, 493.83);
  assert.equal(result.employerInssMonthly, 740.74);
  assert.equal(result.afterEmployeeInssMonthly, 11851.84);
  assert.equal(result.employerCostMonthly, 13086.41);
}

{
  const result = serverEngine.calculate({ grossAnnual: 120000 });
  assert.equal(result.deductions.inssEmployee, 4800);
  assert.equal(result.tax.netTax, null);
  assert.equal(result.result.afterEmployeeInssMonthly, 9600);
  assert.equal(result.result.netMonthly, null);
  assert.equal(result.employer.inssEmployer, 7200);
  assert.equal(result.employer.totalCostAnnual, 127200);
}

assert.throws(
  () => serverEngine.reverseCalculate({ netAnnual: 100000 }),
  /unavailable while the current IRS schedule is unconfirmed/
);
assert.equal(serverEngine.sourceCheckedOn, '2026-07-22');
console.log('Sao Tome verified INSS fixtures and IRS safety lock passed.');
