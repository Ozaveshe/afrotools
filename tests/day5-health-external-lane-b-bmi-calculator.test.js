'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/bmi-calculator/bmi-engine.js');
const html = fs.readFileSync(path.join(root, 'tools/bmi-calculator/index.html'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/bmi-calculator.json'), 'utf8'));

test('metric and imperial calculations are equivalent and expose their working', () => {
  const metric = engine.calculate({ audience: 'adult', units: 'metric', heightCm: 177.8, weightKg: 81.6466266 });
  const imperial = engine.calculate({ audience: 'adult', units: 'imperial', feet: 5, inches: 10, pounds: 180 });
  assert.ok(Math.abs(metric.bmi-imperial.bmi)<0.01);
  assert.equal(metric.bmi.toFixed(1), imperial.bmi.toFixed(1));
  assert.match(metric.working, /^81\.6466266 ÷/);
  assert.equal(imperial.working, '703 × 180 ÷ (70.0 × 70.0)');
  assert.equal(Number(imperial.normalized.heightCm.toFixed(1)), 177.8);
  assert.equal(Number(imperial.normalized.weightKg.toFixed(2)), 81.65);
});

test('uses unrounded values for exact screening boundaries', () => {
  const at185 = engine.calculate({ audience: 'adult', units: 'metric', heightCm: 200, weightKg: 74 });
  const at25 = engine.calculate({ audience: 'adult', units: 'metric', heightCm: 200, weightKg: 100 });
  const at30 = engine.calculate({ audience: 'adult', units: 'metric', heightCm: 200, weightKg: 120 });
  assert.equal(at185.band, '18.5–24.9 screening band');
  assert.equal(at25.band, '25.0–29.9 screening band');
  assert.equal(at30.band, '30 or above screening band');
  assert.match(at25.boundaryNote, /close to the 25 screening boundary/i);
});

test('blocks adult bands for under-20 and pregnancy pathways', () => {
  assert.throws(
    () => engine.calculate({ audience: 'under20', units: 'metric', heightCm: 160, weightKg: 50 }),
    /age- and sex-specific growth assessment/
  );
  assert.throws(
    () => engine.calculate({ audience: 'pregnancy', units: 'metric', heightCm: 160, weightKg: 60 }),
    /not appropriate during pregnancy/
  );
  assert.throws(
    () => engine.calculate({ audience: '', units: 'metric', heightCm: 160, weightKg: 60 }),
    /Confirm/
  );
});

test('rejects fractional feet and out-of-range measurements', () => {
  assert.throws(
    () => engine.calculate({ audience: 'adult', units: 'imperial', feet: 5.5, inches: 0, pounds: 180 }),
    /whole number/
  );
  assert.throws(
    () => engine.calculate({ audience: 'adult', units: 'imperial', feet: 5, inches: 12, pounds: 180 }),
    /Inches must be between/
  );
  assert.throws(
    () => engine.calculate({ audience: 'adult', units: 'metric', heightCm: 170, weightKg: 401 }),
    /Weight must be between/
  );
});

test('page and AI context preserve the quick-adult-calculation contract', () => {
  assert.match(html, /Who is this calculation for/);
  assert.match(html, /Calculation:<\/strong>/);
  assert.match(html, /Converted measurements:<\/strong>/);
  assert.match(html, /id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.equal((html.match(/theme\.addEventListener\('click'/g) || []).length, 1);
  assert.doesNotMatch(html, /\.onclick\s*=|fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  assert.equal(context.sourceReviewDate, '2026-07-26');
  assert.match(context.staticText, /unrounded value/);
  assert.match(context.staticText, /not a risk estimate/);
  assert.match(context.privacy, /remain in the current browser page/i);
});
