const assert = require('assert');
const engine = require('../../assets/js/engines/mortgage-planner.js');

const base = engine.calculate({ propertyPrice: 1000000, deposit: 200000, annualRate: 12, termYears: 20, upfrontCosts: 30000, monthlyCosts: 2500, stressIncrease: 3, confirmedAssumptions: true });
assert.strictEqual(base.principal, 800000);
assert.strictEqual(base.months, 240);
assert.strictEqual(base.monthlyPrincipalInterest, 8808.69);
assert.strictEqual(base.allInMonthly, 11308.69);
assert.strictEqual(base.ltv, 80);
assert.strictEqual(base.upfrontCash, 230000);
assert(base.totalInterest > base.principal);
assert(base.stressMonthly > base.allInMonthly);
assert.strictEqual(base.schedule.length, 20);
assert.strictEqual(base.schedule.at(-1).balance, 0);

const zero = engine.calculate({ propertyPrice: 120000, deposit: 0, annualRate: 0, termYears: 10, confirmedAssumptions: true });
assert.strictEqual(zero.monthlyPrincipalInterest, 1000);
assert.strictEqual(zero.totalInterest, 0);
assert.strictEqual(zero.tip, 0);

const short = engine.calculate({ propertyPrice: 12000, deposit: 0, annualRate: 0, termYears: 1.5, confirmedAssumptions: true });
assert.strictEqual(short.months, 18);
assert.strictEqual(short.schedule.length, 2);
assert.strictEqual(short.schedule[1].months, 6);
assert.strictEqual(short.comparisonMonths, 18);

assert.throws(() => engine.calculate({ propertyPrice: 1, deposit: 0, annualRate: 1, termYears: 1 }), /Confirm/);
assert.throws(() => engine.calculate({ propertyPrice: 1, deposit: 2, annualRate: 1, termYears: 1, confirmedAssumptions: true }), /Deposit/);
assert.throws(() => engine.calculate({ propertyPrice: 1, deposit: 0, annualRate: -1, termYears: 1, confirmedAssumptions: true }), /rate/);
console.log('Mortgage planner engine fixtures passed.');
