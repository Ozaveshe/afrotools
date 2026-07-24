'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../assets/js/engines/salary-offer-compare.js');

const fixedNow = '2026-07-22T12:00:00Z';
const left = {
  label: 'Current package', base: 100000, period: 'monthly', cash: 10000,
  bonus: 50000, nonCash: 120000, employer: 60000, hours: 40, weeks: 52,
  source: 'Written offer A', sourceDate: '2026-07-20',
};
const right = {
  label: 'New offer', base: 1500000, period: 'annual', cash: 120000,
  bonus: 100000, nonCash: 100000, employer: 90000, hours: 45, weeks: 50,
  source: 'Written offer B', sourceDate: '2026-07-20',
};

const compared = engine.compare(left, right, fixedNow);
assert.equal(compared.ok, true);
assert.equal(compared.left.annualBase, 1200000);
assert.equal(compared.left.annualCashAllowance, 120000);
assert.equal(compared.left.annualGrossEarnings, 1370000);
assert.equal(compared.left.annualPackage, 1550000);
assert.equal(compared.right.annualGrossEarnings, 1720000);
assert.equal(compared.right.annualPackage, 1910000);
assert.equal(compared.grossDelta.absolute, 350000);
assert.equal(compared.packageDelta.absolute, 360000);
assert.ok(Math.abs(compared.left.hourlyGrossEarnings - (1370000 / 2080)) < 1e-9);
assert.ok(Math.abs(compared.grossDelta.percent - (350000 / 1370000 * 100)) < 1e-9);

assert.equal(engine.compare(Object.assign({}, left, { base: -1 }), right, fixedNow).error, 'invalid_amount');
assert.equal(engine.compare(Object.assign({}, left, { hours: 0 }), right, fixedNow).error, 'invalid_time');
assert.equal(engine.compare(Object.assign({}, left, { source: '' }), right, fixedNow).error, 'invalid_source');
assert.equal(engine.compare(Object.assign({}, left, { sourceDate: '2026-07-23' }), right, fixedNow).error, 'invalid_source');
assert.equal(engine.validDate('not-a-date', fixedNow), false);
const zero = engine.compare(Object.assign({}, left, { base: 0, cash: 0, bonus: 0 }), right, fixedNow);
assert.equal(zero.grossDelta.percent, null);

const routes = [
  'tools/salary-compare/index.html',
  'fr/tools/comparateur-salaires/index.html',
  'sw/zana/kilinganisha-mishahara/index.html',
];
routes.forEach(function (route) {
  const html = fs.readFileSync(path.join(__dirname, '..', route), 'utf8');
  assert.ok(html.includes('data-salary-compare-app'), route + ' must use the native comparator');
  assert.ok(html.includes('salary-offer-compare.js'), route + ' must use the pure engine');
  assert.ok(html.includes('ILOSTAT'), route + ' must disclose method context');
  assert.ok(!/\.netlify\/functions\/ai-advisor|20 roles|15 (?:African )?countries|PPP-adjusted|skill premiums|gender gap|2-5x/i.test(html), route + ' must not retain unsupported claims or AI calls');
});

const controller = fs.readFileSync(path.join(__dirname, '..', 'assets/js/pages/salary-compare-vip.js'), 'utf8');
assert.ok(!/fetch\s*\(|XMLHttpRequest|localStorage|sessionStorage/.test(controller));
assert.ok(controller.includes("salary-offer-comparison.csv"));
assert.ok(controller.includes("window.AfroTools.pdf.generate"));

console.log('salary-offer-compare: 18 assertions passed');
