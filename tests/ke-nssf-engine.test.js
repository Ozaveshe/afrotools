'use strict';
const assert = require('assert');
const engine = require('../engines/src/ke-nssf-engine.js');

function scenario(earnings, extras) {
  return engine.calculate(Object.assign({ monthlyPensionableEarnings: earnings, contributionPeriod: '2026-07', employeeActual: '', employerActual: '' }, extras));
}

let result = scenario(5000);
assert.strictEqual(result.ok, true);
assert.strictEqual(result.tier1Employee, 300);
assert.strictEqual(result.tier2Employee, 0);
assert.strictEqual(result.combinedExpected, 600);

result = scenario(100000, { employeeActual: 5900, employerActual: 6000 });
assert.strictEqual(result.employeeExpected, 6000);
assert.strictEqual(result.employerExpected, 6000);
assert.strictEqual(result.employeeVariance, -100);
assert.strictEqual(result.employerVariance, 0);

result = scenario(150000);
assert.strictEqual(result.tier1Employee, 540);
assert.strictEqual(result.tier2Employee, 5940);
assert.strictEqual(result.employeeExpected, 6480);
assert.strictEqual(result.combinedExpected, 12960);
assert.strictEqual(result.earningsAboveUpperLimit, 42000);

assert.strictEqual(scenario(100000, { contributionPeriod: '2026-01' }).error, 'unsupported_period');
assert.strictEqual(scenario(100000, { contributionPeriod: '2026-08' }).error, 'unsupported_period');
assert.strictEqual(scenario(0).error, 'invalid_earnings');
assert.strictEqual(scenario(100000, { employeeActual: -1 }).error, 'invalid_actual');

const whatsapp = require('../netlify/functions/afrowork-whatsapp.js');
const botResult = whatsapp._test.calculateKenyaNssfYear4(150000);
assert.strictEqual(botResult.employee, 6480);
assert.strictEqual(botResult.employer, 6480);
console.log('Kenya NSSF engine/function: 8 checks passed');
