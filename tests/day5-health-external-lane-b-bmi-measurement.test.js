'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const engine = require('../health/bmi-calculator/bmi-measurement-engine.js');
const html = fs.readFileSync(path.join(root, 'health/bmi-calculator/index.html'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/bmi-measurement-quality.json'), 'utf8'));

test('calculates centre and observed interval from the entered repeat readings', () => {
  const result = engine.assess({
    heightCm: 180,
    repeatHeightCm: 179,
    weightKg: 80,
    repeatWeightKg: 82,
    sameConditions: 'yes'
  });

  assert.equal(Number(result.meanHeight.toFixed(1)), 179.5);
  assert.equal(result.meanWeight, 81);
  assert.equal(result.heightDifference, 1);
  assert.equal(result.weightDifference, 2);
  assert.equal(Number(result.bmi.toFixed(1)), 25.1);
  assert.equal(Number(result.low.toFixed(1)), 24.7);
  assert.equal(Number(result.high.toFixed(1)), 25.6);
  assert.match(result.displayNote, /24.7 to 25.6/);
  assert.match(result.conditionsNote, /does not prove device accuracy/i);
});

test('does not invent an uncertainty interval when no repeat readings exist', () => {
  const result = engine.assess({ heightCm: 180, weightKg: 80, sameConditions: 'unknown' });
  assert.equal(result.anyRepeat, false);
  assert.equal(result.low, result.high);
  assert.match(result.displayNote, /repeatability cannot be assessed/i);
  assert.match(result.conditionsNote, /source of any spread is unknown/i);
});

test('separates different measurement conditions from device repeatability', () => {
  const result = engine.assess({
    heightCm: 180,
    repeatHeightCm: 180,
    weightKg: 80,
    repeatWeightKg: 81,
    sameConditions: 'no'
  });
  assert.match(result.conditionsNote, /Do not interpret the spread as scale or stadiometer repeatability/);
  assert.match(result.warning, /not a diagnosis/i);
});

test('rejects partial, non-finite and out-of-range values', () => {
  assert.throws(() => engine.assess({ heightCm: 99, weightKg: 80 }), /First height/);
  assert.throws(() => engine.assess({ heightCm: 180, weightKg: 24 }), /First weight/);
  assert.throws(() => engine.assess({ heightCm: 180, repeatHeightCm: 'bad', weightKg: 80 }), /Second height/);
});

test('page and AI context preserve the measurement-quality-only contract', () => {
  assert.match(html, /Second height reading/);
  assert.match(html, /It does not invent a universal device tolerance/);
  assert.match(html, /Observed BMI interval/);
  assert.match(html, /id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.equal((html.match(/theme\.addEventListener\('click'/g) || []).length, 1);
  assert.doesNotMatch(html, /±0\.5|plus or minus 0\.5|\.onclick\s*=/);
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  assert.equal(context.sourceReviewDate, '2026-07-26');
  assert.match(context.staticText, /not a device tolerance, statistical confidence interval or health-risk range/i);
  assert.match(context.privacy, /remain in the current browser page/i);
});
