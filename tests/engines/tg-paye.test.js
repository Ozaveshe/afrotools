'use strict';

const assert = require('assert');
const browserEngine = require('../../assets/js/engines/tg-paye');
const serverEngine = require('../../netlify/functions/_engines/tg-paye');

{
  const result = browserEngine.calculate({ grossAnnual: 0 });
  assert.equal(result.payeAnnual, 0);
  assert.equal(result.employeeCnssAnnual, 0);
  assert.equal(result.netAnnual, 0);
}

{
  const result = browserEngine.calculate({ grossAnnual: 1200000 });
  assert.equal(result.employeeCnssAnnual, 48000);
  assert.equal(Math.round(result.professionalDeduction), 322560);
  assert.equal(result.taxableIncome, 829000);
  assert.equal(result.payeAnnual, 0);
  assert.equal(result.netAnnual, 1152000);
  assert.equal(result.employerCnssAnnual, 210000);
}

{
  const result = browserEngine.calculate({ grossAnnual: 6000000, dependents: 2 });
  assert.equal(result.employeeCnssAnnual, 240000);
  assert.equal(Math.round(result.professionalDeduction), 1612800);
  assert.equal(result.dependentRelief, 240000);
  assert.equal(result.taxableIncome, 3907000);
  assert.equal(result.payeAnnual, 153700);
  assert.equal(result.netAnnual, 5606300);
  assert.equal(result.employerCostAnnual, 7050000);
}

{
  const result = browserEngine.calculate({ grossAnnual: 24000000, dependents: 9 });
  assert.equal(result.dependents, 6);
  assert.equal(Math.round(result.professionalDeduction), 2800000);
  assert.equal(result.dependentRelief, 720000);
  assert.equal(result.taxableIncome, 19520000);
  assert.equal(result.payeAnnual, 3519000);
  assert.equal(result.netAnnual, 19521000);
}

const boundaries = [
  [900000, 0],
  [900001, 0],
  [3000000, 63000],
  [6000000, 363000],
  [9000000, 813000],
  [12000000, 1413000],
  [15000000, 2163000],
  [20000000, 3663000],
  [21000000, 4013000]
];
for (const [taxable, expected] of boundaries) {
  assert.equal(browserEngine.taxAnnual(taxable).tax, expected, `taxable boundary ${taxable}`);
}

{
  const server = serverEngine.calculate({ grossAnnual: 6000000, dependents: 2 });
  assert.equal(server.tax.taxableIncome, 3907000);
  assert.equal(server.tax.netTax, 153700);
  assert.equal(server.deductions.cnssEmployee, 240000);
  assert.equal(server.result.netAnnual, 5606300);
  assert.equal(server.employer.totalCostAnnual, 7050000);
}

{
  const reverse = browserEngine.reverse({ netAnnual: 5606300, dependents: 2 });
  assert.ok(Math.abs(reverse.grossAnnual - 6000000) < 1);
}

assert.equal(browserEngine.sourceCheckedOn, '2026-07-22');
assert.equal(serverEngine.formulaParameters.taxableRounding, 'down-to-1000-XOF');
console.log('Togo PAYE official annual fixtures passed.');
