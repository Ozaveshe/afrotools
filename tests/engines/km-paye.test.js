'use strict';

const assert = require('assert');
const engine = require('../../assets/js/engines/km-paye');
const server = require('../../netlify/functions/_engines/km-paye');

assert.strictEqual(globalThis.AfroTools.engines.comorosPaye, engine, 'browser namespace contract exposed');

function near(actual, expected, label) {
  assert.ok(Math.abs(actual - expected) < 0.001, `${label}: expected ${expected}, got ${actual}`);
}

[
  [0, 0], [150000, 0], [150001, 0.05], [500000, 17500], [500001, 17500.10],
  [1000000, 67500], [1000001, 67500.15], [1500000, 142500], [1500001, 142500.20],
  [2500000, 342500], [2500001, 342500.25], [3500000, 592500], [3500001, 592500.30]
].forEach(([income, tax]) => near(engine.calculateAnnualTax(income).tax, tax, `annual tax at ${income}`));

const defaultCase = engine.calculate({ grossMonthly: 1000000 / 12 });
assert.strictEqual(defaultCase.ok, true);
near(defaultCase.grossAnnual, 1000000, 'default annual gross');
near(defaultCase.professionalExpenseDeductionAnnual, 300000, 'default professional expense');
near(defaultCase.taxableAnnual, 700000, 'default taxable income');
near(defaultCase.incomeTaxAnnual, 37500, 'default annual tax');
near(defaultCase.netAnnual, 962500, 'default annual net');

const approvedContribution = engine.calculate({ grossMonthly: 1000000, employeeContributionRate: 0.03 });
near(approvedContribution.employeeContributionAnnual, 360000, 'approved employee contribution');
near(approvedContribution.taxableAnnual, 8148000, 'taxable income after contribution and standard expense');
near(approvedContribution.incomeTaxAnnual, 1986900, 'tax after approved contribution');
near(approvedContribution.netAnnual, 9653100, 'net after approved contribution and tax');

assert.strictEqual(engine.calculate({ grossMonthly: 1000, employeeContributionRate: -0.01 }).ok, false, 'negative contribution rate rejected');
assert.strictEqual(engine.calculate({ grossMonthly: 1000, employeeContributionRate: 0.060001 }).ok, false, 'rate above statutory deduction cap rejected');
assert.strictEqual(engine.calculate({ grossMonthly: -1 }).ok, false, 'negative gross rejected');
assert.strictEqual(engine.calculate({ grossMonthly: 0 }).netAnnual, 0, 'zero gross supported');

const api = server.calculate({ grossAnnual: 1000000 });
assert.strictEqual(api.tax.professionalExpenseDeduction, 300000);
assert.strictEqual(api.tax.taxableIncome, 700000);
assert.strictEqual(api.tax.netTax, 37500);
assert.strictEqual(api.result.netAnnual, 962500);
assert.strictEqual(Object.prototype.hasOwnProperty.call(api, 'employer'), false, 'unsupported employer costs omitted');
assert.strictEqual(JSON.stringify(engine.formulaParameters).includes('civil'), false, 'unsupported sector rates omitted');

const apiContribution = server.calculate({ grossMonthly: 1000000, employeeContributionRate: 0.03 });
assert.strictEqual(apiContribution.deductions.employeeContribution, 360000);
assert.strictEqual(apiContribution.tax.netTax, 1986900);
assert.strictEqual(apiContribution.result.netAnnual, 9653100);

assert.strictEqual(engine.source.articles.includes('97'), true, 'official rate article identified');
assert.match(engine.source.caveat, /Confirm later amendments/);

console.log('Comoros CGI 2023 statutory-reference PAYE fixtures passed.');
