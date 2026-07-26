'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/diabetes-risk/diabetes-risk-engine.js');
const html = fs.readFileSync(path.join(root, 'tools/diabetes-risk/index.html'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/diabetes-risk.json'), 'utf8'));

test('uses the documented CDC score boundaries, including the optional lower BMI threshold', () => {
  const base = { age: 39, sex: 'female', heightCm: 170, weightKg: 67 };
  const standard = engine.score(base);
  const adjusted = engine.score({ ...base, asianAmericanThreshold: true });

  assert.equal(Number(standard.bmi.toFixed(1)), 23.2);
  assert.equal(standard.total, 0);
  assert.equal(standard.lowerBmiThreshold, 25);
  assert.equal(adjusted.total, 1);
  assert.equal(adjusted.lowerBmiThreshold, 23);
  assert.deepEqual(
    [39, 40, 50, 60].map((age) => engine.score({ ...base, age }).breakdown[0].points),
    [0, 1, 2, 3]
  );
});

test('gives symptoms, pregnancy and a previous abnormal result priority over a low score', () => {
  const result = engine.score({
    age: 25,
    sex: 'female',
    heightCm: 170,
    weightKg: 60,
    symptoms: true,
    pregnant: true,
    previousAbnormal: true
  });

  assert.equal(result.total, 0);
  assert.equal(result.band, 'Do not rely on the score alone');
  assert.equal(result.priorityReasons.length, 3);
  assert.match(result.message, /do not wait/i);
  assert.match(result.message, /pregnancy uses a separate clinical testing pathway/i);
  assert.match(result.message, /previous abnormal glucose result needs follow-up/i);
  assert.match(result.warning, /not a diagnosis/i);
});

test('rejects invalid age and measurement inputs instead of silently scoring them', () => {
  assert.throws(
    () => engine.score({ age: 40.5, sex: 'female', heightCm: 170, weightKg: 70 }),
    /whole number/
  );
  assert.throws(
    () => engine.score({ age: 40, sex: 'female', heightCm: 99, weightKg: 70 }),
    /Height must be between/
  );
  assert.throws(
    () => engine.score({ age: 40, sex: '', heightCm: 170, weightKg: 70 }),
    /Choose the sex/
  );
});

test('page exposes the individual workflow, local exports and a single two-way theme handler', () => {
  assert.match(html, /Reasons not to rely on a low score/);
  assert.match(html, /lower BMI threshold for Asian American adults/);
  assert.match(html, /id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.match(html, /panel\.focus\(\)/);
  assert.equal((html.match(/theme\.addEventListener\('click'/g) || []).length, 1);
  assert.doesNotMatch(html, /\.onclick\s*=/);
  assert.match(html, /Download TXT/);
  assert.match(html, /Print \/ save PDF/);
  assert.doesNotMatch(html, /fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
});

test('AI context preserves screening-only and sensitive-data boundaries', () => {
  assert.equal(context.toolKey, 'diabetes-risk');
  assert.equal(context.sourceReviewDate, '2026-07-26');
  assert.match(context.staticText, /never diagnosis or a rule-out/i);
  assert.match(context.staticText, /previous abnormal glucose result override reliance on the score/i);
  assert.match(context.staticText, /do not request identifiers, store, log, upload, sync, email/i);
});
