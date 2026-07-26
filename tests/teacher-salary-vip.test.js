'use strict';

const assert = require('node:assert/strict');
const engine = require('../tools/teacher-salary/teacher-salary-engine.js');

const result = engine.validate({
  baseMonthly: 100000,
  allowancesMonthly: 20000,
  deductionsMonthly: 15000,
  weeklyHours: 40,
  workingWeeks: 48
});
assert.equal(result.ok, true);
assert.equal(result.grossCashMonthly, 120000);
assert.equal(result.estimatedTakeHomeMonthly, 105000);
assert.equal(result.annualCash, 1440000);
assert.equal(result.annualTakeHome, 1260000);
assert.equal(result.annualHours, 1920);
assert.equal(result.grossHourly, 750);
assert.equal(result.takeHomeHourly, 656.25);
assert.equal(result.deductionShare, 12.5);

assert.equal(engine.validate({ baseMonthly: 0, weeklyHours: 40, workingWeeks: 44 }).ok, false);
assert.match(engine.validate({ baseMonthly: 10, deductionsMonthly: 20, weeklyHours: 40, workingWeeks: 44 }).errors.join(' '), /cannot exceed/i);
assert.equal(engine.validate({ baseMonthly: 10, weeklyHours: 101, workingWeeks: 44 }).ok, false);
assert.equal(engine.validate({ baseMonthly: 10, weeklyHours: 40, workingWeeks: 53 }).ok, false);
assert.equal(engine.validate({ baseMonthly: -1, weeklyHours: 40, workingWeeks: 44 }).ok, false);

console.log('teacher-salary VIP engine tests: 14 assertions passed');
