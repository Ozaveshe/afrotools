'use strict';
const assert = require('node:assert/strict');
const engine = require('../tools/student-loan-repay/student-loan-engine.js');

const zero = engine.calculate({ principal: 1000, annualRate: 0, months: 10 });
assert.equal(zero.scheduledPayment, 100);
assert.equal(zero.totalInterest, 0);
assert.equal(zero.schedule.at(-1).balance, 0);

const standard = engine.calculate({ principal: 100000, annualRate: 12, months: 12 });
assert.ok(Math.abs(standard.scheduledPayment - 8884.878867) < 0.00001);
assert.ok(Math.abs(standard.schedule.reduce((sum, row) => sum + row.principal, 0) - 100000) < 0.001);
assert.equal(standard.schedule.at(-1).balance, 0);

const comparison = engine.compare({ principal: 100000, annualRate: 12, months: 36, extraPayment: 1000 });
assert.ok(comparison.monthsSaved > 0);
assert.ok(comparison.interestSaved > 0);

[
  { principal: 0, annualRate: 1, months: 12 },
  { principal: -1, annualRate: 1, months: 12 },
  { principal: 1, annualRate: -1, months: 12 },
  { principal: 1, annualRate: 1, months: 0 },
  { principal: 1, annualRate: 1, months: 12, extraPayment: -1 }
].forEach((input) => assert.throws(() => engine.calculate(input)));

console.log('student-loan-engine: ok');
