'use strict';
const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const context = { globalThis: {} };
vm.runInNewContext(fs.readFileSync('engines/src/ng-pension-engine.js', 'utf8'), context);
const engine = context.globalThis.NgPensionEngine;

const base = {
  openingBalance: 1000000,
  monthlyEmoluments: 500000,
  employeeRate: 8,
  employerRate: 10,
  voluntaryContribution: 0,
  annualNetReturn: 0,
  annualSalaryGrowth: 0,
  years: 1,
  sourceLabel: 'Payroll plus PRA 2014 section 4',
  sourceDate: '2026-07-22',
  returnSource: 'Statement scenario',
  returnSourceDate: '2026-07-22',
  today: '2026-07-22'
};

const contributionCheck = engine.checkContributions(500000, 8, 10);
assert.strictEqual(contributionCheck.ok, true);
assert.strictEqual(contributionCheck.pensionableEmoluments, 500000);
assert.strictEqual(contributionCheck.expectedEmp, 40000);
assert.strictEqual(contributionCheck.expectedEr, 50000);
assert.strictEqual(contributionCheck.totalExpectedMonthly, 90000);
const zeroReturn = engine.calculateScenario(base);
assert.strictEqual(zeroReturn.ok, true);
assert.strictEqual(zeroReturn.firstTotalContribution, 90000);
assert.strictEqual(zeroReturn.futureContributions, 1080000);
assert.strictEqual(zeroReturn.modeledGrowth, 0);
assert.strictEqual(zeroReturn.projectedBalance, 2080000);
assert.strictEqual(zeroReturn.schedule.length, 1);

const withReturn = engine.calculateScenario(Object.assign({}, base, { openingBalance: 0, annualNetReturn: 12, voluntaryContribution: 10000, years: 2 }));
assert.strictEqual(withReturn.ok, true);
assert.ok(withReturn.projectedBalance > withReturn.futureContributions);
assert.strictEqual(withReturn.schedule.length, 2);
assert.ok(Math.abs(withReturn.modeledGrowth - (withReturn.projectedBalance - withReturn.futureContributions)) < 0.01);

assert.strictEqual(engine.calculateScenario(Object.assign({}, base, { annualNetReturn: '' })).error, 'invalid_assumption');
assert.strictEqual(engine.calculateScenario(Object.assign({}, base, { sourceDate: '2025-07-21' })).error, 'invalid_evidence');
assert.strictEqual(engine.calculateScenario(Object.assign({}, base, { returnSourceDate: '2026-07-23' })).error, 'invalid_evidence');
assert.strictEqual(engine.calculateScenario(Object.assign({}, base, { years: 0 })).error, 'invalid_period');
console.log('Nigeria pension engine: 7 checks passed');
