'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const engine = require('../../assets/js/engines/gw-paye');

test('Guinea-Bissau primary employment fixture preserves bands and INSS rounding', () => {
  const result = engine.calculate({
    grossMonthly: 500000,
    includeEmployeeInss: true,
    secondary: false
  });
  assert.equal(result.ok, true);
  assert.equal(result.employeeInssMonthly, 40000);
  assert.equal(result.taxableMonthly, 460000);
  assert.equal(result.payeMonthly, 73500);
  assert.equal(result.netMonthly, 386500);
  assert.equal(result.employerInssMonthly, 70000);
  assert.equal(result.employerCostMonthly, 570000);
});

test('Guinea-Bissau secondary employment uses the explicit 30 percent model', () => {
  const result = engine.calculate({
    grossMonthly: 500000,
    includeEmployeeInss: true,
    secondary: true
  });
  assert.equal(result.payeMonthly, 150000);
  assert.equal(result.netMonthly, 310000);
  assert.equal(result.bands.length, 1);
  assert.equal(result.bands[0].rate, 0.30);
});

test('Guinea-Bissau engine fails closed on invalid gross pay', () => {
  assert.equal(engine.calculate({ grossMonthly: -1 }).ok, false);
  assert.equal(engine.calculate({ grossMonthly: 'not-a-number' }).ok, false);
});
