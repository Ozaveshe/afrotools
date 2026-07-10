const assert = require('assert');
const nigeria = require('../netlify/functions/_engines/ng-paye.js');

const result = nigeria.calculate({
  grossAnnual: 7200000,
  regime: 'NTA_2026',
  pension: false,
  nhf: false,
  nhis: false,
  pensionAmount: 480000,
  nhfAmount: 120000,
  nhisAmount: 60000,
  annualRent: 2400000,
  mortgageInterest: 100000,
  lifeAssurance: 50000,
});

assert.strictEqual(result.deductions.pension, 480000);
assert.strictEqual(result.deductions.nhf, 120000);
assert.strictEqual(result.deductions.nhis, 60000);
assert.strictEqual(result.deductions.rentRelief, 480000);
assert.strictEqual(result.deductions.mortgageInterest, 100000);
assert.strictEqual(result.deductions.lifeAssurance, 50000);
assert.strictEqual(result.tax.taxableIncome, 5910000);

const exempt = nigeria.calculate({
  grossAnnual: 840000,
  regime: 'NTA_2026',
  pension: false,
  nhf: false,
  nhis: false,
  minimumWageExempt: true,
});
assert.strictEqual(exempt.tax.netTax, 0);

assert.throws(
  () => nigeria.calculate({ grossAnnual: 7200000, pensionAmount: -1 }),
  /pensionAmount must be a non-negative number/,
);

console.log('AfroTools SalaryPadi PAYE input tests passed.');
