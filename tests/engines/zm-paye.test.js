'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const engine = require('../../netlify/functions/_engines/zm-paye');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

test('French calculation agrees with the official example and validates basic salary', () => {
  const context = { window: {}, document: { readyState: 'loading', addEventListener() {} } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../../assets/js/pages/french-paye-parity.js'), 'utf8'), context);
  const api = context.window.AfroTools.frenchPayeParity;
  const result = api.calculate(api.configs['zm-paye'], 15000, 10000);
  assert.equal(result.taxMonthly, 3176);
  assert.equal(result.healthMonthly, 100);
  assert.equal(result.netMonthly, 10974);
  assert.equal(result.employerCostMonthly, 15850);
  assert.throws(() => api.calculate(api.configs['zm-paye'], 15000, 15001), /salaire de base/);
  assert.equal(api.calculate(api.configs['zm-paye'], 50000).employeeMonthly, 1861.80);
});

test('ZRA K15,000 monthly example taxes gross income at K3,176', () => {
  const result = engine.calculate({ grossAnnual: 180000, basicAnnual: 120000 });
  assert.equal(result.tax.taxableIncome, 180000);
  assert.equal(result.tax.netTax, 3176 * 12);
  assert.equal(result.deductions.nhima, 1200);
  assert.equal(result.employer.nhima, 1200);
  assert.equal(result.result.netAnnual, 131688);
});

test('2026 NAPSA ceiling applies independently to employee and employer', () => {
  for (const monthlyGross of [37235, 37236, 50000]) {
    const result = engine.calculate({ grossAnnual: monthlyGross * 12 });
    const expected = Math.round(Math.min(monthlyGross * 0.05, 1861.80) * 12);
    assert.equal(result.deductions.napsa, expected);
    assert.equal(result.employer.napsa, expected);
  }
});

test('NHIMA uses supplied basic salary and discloses the fallback once', () => {
  const explicit = engine.calculate({ grossAnnual: 600000, basicAnnual: 360000 });
  assert.equal(explicit.deductions.nhima, 3600);
  assert.equal(explicit.employer.nhima, 3600);
  assert.equal(explicit.meta.assumptions, undefined);
  const fallback = engine.calculate({ grossAnnual: 600000 });
  assert.equal(fallback.deductions.nhima, 6000);
  assert.equal(fallback.meta.assumptions.length, 1);
  assert.equal(engine.calculate({ grossAnnual: 600000, basicAnnual: 0 }).deductions.nhima, 0);
  for (const basicAnnual of [-1, 600001, 'invalid', Infinity]) {
    assert.throws(() => engine.calculate({ grossAnnual: 600000, basicAnnual }), RangeError);
  }
});

test('reverse calculation preserves a fixed basic salary contribution base', () => {
  const forward = engine.calculate({ grossAnnual: 600000, basicAnnual: 360000 });
  const reverse = engine.reverseCalculate({ netAnnual: forward.result.netAnnual, basicAnnual: 360000 });
  assert.ok(Math.abs(reverse.input.grossAnnual - 600000) < 5);
  assert.equal(reverse.deductions.nhima, 3600);
  assert.throws(() => engine.reverseCalculate({ netAnnual: 1000, basicAnnual: 360000 }), RangeError);
});
