'use strict';

const assert = require('assert');
const engine = require('../../netlify/functions/_engines/mr-paye');
const gambia = require('../../netlify/functions/_engines/gm-paye');

const fixtures = [
  { grossMonthly: 6000, taxableMonthly: 0, taxMonthly: 0, cnssMonthly: 60, netMonthly: 5940 },
  { grossMonthly: 10000, taxableMonthly: 3900, taxMonthly: 585, cnssMonthly: 100, netMonthly: 9315 },
  { grossMonthly: 16000, taxableMonthly: 9850, taxMonthly: 1562.5, cnssMonthly: 150, netMonthly: 14288 },
  { grossMonthly: 30000, taxableMonthly: 23850, taxMonthly: 5490, cnssMonthly: 150, netMonthly: 24360 }
];

for (const fixture of fixtures) {
  const result = engine.calculate({ grossAnnual: fixture.grossMonthly * 12 });
  assert.strictEqual(result.tax.taxableIncome / 12, fixture.taxableMonthly, `taxable base at MRU ${fixture.grossMonthly}`);
  assert.strictEqual(result.tax.netTax / 12, fixture.taxMonthly, `ITS at MRU ${fixture.grossMonthly}`);
  assert.strictEqual(result.deductions.cnss / 12, fixture.cnssMonthly, `worker CNSS at MRU ${fixture.grossMonthly}`);
  assert.strictEqual(result.result.netMonthly, fixture.netMonthly, `net pay at MRU ${fixture.grossMonthly}`);
}

const employer = engine.calculate({ grossAnnual: 30000 * 12 }).employer;
assert.strictEqual(employer.cnssEmployer / 12, 1950);
assert.strictEqual(employer.workMedicine / 12, 300);
assert.strictEqual(employer.totalCostMonthly, 32250);
assert.strictEqual(engine.formulaParameters.taxFreeAllowance, 6000);
assert.strictEqual(engine.formulaParameters.taxableRoundingStep, 10);
assert.ok(!Object.prototype.hasOwnProperty.call(gambia.formulaParameters, 'taxFreeAllowance'));
assert.ok(!Object.prototype.hasOwnProperty.call(gambia.formulaParameters, 'taxableRoundingStep'));

console.log('Mauritania PAYE official monthly fixtures passed.');
