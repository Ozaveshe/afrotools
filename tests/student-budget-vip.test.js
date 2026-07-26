'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/student-budget/student-budget-engine.js');

const term = engine.calculate({
  periodMonths: 4,
  monthlyIncome: 1000,
  periodFunding: 500,
  monthlyExpenses: { housing: 300, food: 200, transport: 100 },
  periodExpenses: { tuition: 1000, setup: 100 }
});
assert.equal(term.ok, true);
assert.equal(term.monthlyExpenseTotal, 600);
assert.equal(term.periodExpenseTotal, 1100);
assert.equal(term.totalResources, 4500);
assert.equal(term.totalExpenses, 3500);
assert.equal(term.balance, 1000);
assert.equal(term.monthlyResourceEquivalent, 1125);
assert.equal(term.monthlyExpenseEquivalent, 875);
assert.equal(term.monthlyBalanceEquivalent, 250);
assert.equal(term.coverageRatio, 4500 / 3500);
assert.deepEqual(term.largestExpense, { key: 'housing', amount: 1200, cadence: 'monthly' });

const halfMonth = engine.calculate({
  periodMonths: 0.5,
  monthlyIncome: 100,
  periodFunding: 0,
  monthlyExpenses: { food: 40 },
  periodExpenses: { tuition: 10 }
});
assert.equal(halfMonth.totalResources, 50);
assert.equal(halfMonth.totalExpenses, 30);
assert.equal(halfMonth.balance, 20);

assert.equal(engine.calculate({ periodMonths: 0, monthlyExpenses: {}, periodExpenses: {} }).ok, false);
assert.equal(engine.calculate({ periodMonths: 25, monthlyExpenses: {}, periodExpenses: {} }).ok, false);
assert.equal(engine.calculate({ periodMonths: 1, monthlyIncome: -1, monthlyExpenses: {}, periodExpenses: {} }).ok, false);
assert.equal(engine.calculate({ periodMonths: 1, monthlyExpenses: { food: -1 }, periodExpenses: {} }).ok, false);

console.log('student-budget VIP engine tests: 18 assertions passed');
