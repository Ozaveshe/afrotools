'use strict';

const assert = require('node:assert');
const browser = require('../../assets/js/engines/lr-paye');
const server = require('../../netlify/functions/_engines/lr-paye');

for (const grossAnnual of [0, 70000, 200000, 800000, 1000000, 6000000]) {
  const expected = server.calculate({ grossAnnual });
  const actual = browser.calculate({ grossAnnual });
  assert.strictEqual(Math.round(actual.taxAnnual), expected.tax.netTax, `tax parity at LRD ${grossAnnual}`);
  assert.strictEqual(Math.round(actual.employeeNasscorpAnnual), expected.deductions.nasscorp, `NASSCORP parity at LRD ${grossAnnual}`);
  assert.strictEqual(Math.round(actual.netAnnual), expected.result.netAnnual, `net parity at LRD ${grossAnnual}`);
  assert.strictEqual(Math.round(actual.employerCostAnnual), expected.employer.totalCostAnnual, `employer parity at LRD ${grossAnnual}`);
}

assert.strictEqual(browser.formulaParameters.ssDeductibleFromTaxable, false);
assert.strictEqual(browser.sourceCheckedOn, server.sourceCheckedOn);
assert.strictEqual(browser.calculate({ grossAnnual: -1 }).ok, false);
assert.strictEqual(browser.calculate({ grossAnnual: Number.NaN }).ok, false);
console.log('Liberia browser PAYE engine matches the reviewed server engine.');
