const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const ROOT = path.resolve(__dirname, '..');
const engine = require(path.join(ROOT, 'tools', 'drug-dosage', 'drug-dosage-engine.js'));
const HTML = fs.readFileSync(path.join(ROOT, 'tools', 'drug-dosage', 'index.html'), 'utf8');

function base(overrides = {}) {
  return {
    instructionConfirmed: true,
    medicationName: 'Synthetic test medicine',
    basis: 'fixed',
    prescribedDose: 250,
    doseUnit: 'mg',
    mode: 'mass',
    ...overrides
  };
}

test('fixed mass arithmetic normalizes supported units deterministically', () => {
  assert.equal(engine.calculate(base()).totalMg, 250);
  assert.equal(engine.calculate(base({ prescribedDose: 0.5, doseUnit: 'g' })).totalMg, 500);
  assert.equal(engine.calculate(base({ prescribedDose: 500, doseUnit: 'mcg' })).totalMg, 0.5);
});

test('weight arithmetic converts pounds to kilograms without supplying a dose', () => {
  const result = engine.calculate(base({
    basis: 'weight',
    prescribedDose: 10,
    doseUnit: 'mg',
    weight: 22.0462262,
    weightUnit: 'lb'
  }));
  assert.equal(result.ok, true);
  assert.ok(Math.abs(result.weightKg - 10) < 1e-7);
  assert.ok(Math.abs(result.totalMg - 100) < 1e-6);
});

test('liquid arithmetic uses one explicit mass-per-mL concentration', () => {
  const result = engine.calculate(base({
    mode: 'liquid',
    concentrationMass: 125,
    concentrationUnit: 'mg',
    concentrationVolume: 5
  }));
  assert.equal(result.ok, true);
  assert.equal(result.value, 10);
  assert.equal(result.unit, 'mL');
});

test('solid arithmetic reports fractions without rounding or split advice', () => {
  const result = engine.calculate(base({
    prescribedDose: 375,
    mode: 'solid',
    unitStrength: 250,
    strengthUnit: 'mg'
  }));
  assert.equal(result.ok, true);
  assert.equal(result.value, 1.5);
  assert.equal(result.isWholeUnit, false);
  assert.match(result.warnings.join(' '), /Do not split, crush, open, or substitute/i);
});

test('confirmation, positive values, units, weight and implausible outputs are blocked', () => {
  assert.equal(engine.calculate(base({ instructionConfirmed: false })).ok, false);
  assert.equal(engine.calculate(base({ prescribedDose: 0 })).ok, false);
  assert.equal(engine.calculate(base({ doseUnit: 'mL' })).ok, false);
  assert.equal(engine.calculate(base({ basis: 'weight', weight: 0, weightUnit: 'kg' })).ok, false);
  assert.equal(engine.calculate(base({ basis: 'weight', weight: 700, weightUnit: 'kg' })).ok, false);
  assert.equal(engine.calculate(base({
    mode: 'liquid',
    concentrationMass: 0.000001,
    concentrationUnit: 'mcg',
    concentrationVolume: 100
  })).ok, false);
});

test('route retires prescribing tables and exposes exact medical/privacy/export boundaries', () => {
  assert.doesNotMatch(HTML, /const DRUGS|updateDrugs|Recommended Dose|Paediatric|Common African Brands|health-workflow\.js|Get PDF plan|email-gated/i);
  assert.doesNotMatch(HTML, /fonts\.googleapis\.com|fonts\.gstatic\.com|chart\.js/i);
  assert.match(HTML, /never chooses a medicine, dose, frequency, duration, or treatment/i);
  assert.match(HTML, /Child or infant dosing/);
  assert.match(HTML, /Pregnancy or breastfeeding advice/);
  assert.match(HTML, /Kidney, liver, allergy, interaction/);
  assert.match(HTML, /Possible overdose, poisoning, wrong medicine/);
  assert.match(HTML, /does not save entries to local storage/);
  assert.match(HTML, /Print \/ Save PDF/);
  assert.match(HTML, /Download text worksheet/);
});

test('route has one main, truthful metadata, valid JSON-LD and current sources', () => {
  assert.equal((HTML.match(/<main(?:\s|>)/g) || []).length, 1);
  assert.equal((HTML.match(/<\/main>/g) || []).length, 1);
  assert.match(HTML, /<title>Medication Dose Arithmetic Checker \| AfroTools<\/title>/);
  assert.match(HTML, /<link rel="canonical" href="https:\/\/afrotools\.com\/tools\/drug-dosage\/">/);
  assert.match(HTML, /<meta property="article:modified_time" content="2026-07-26">/);
  assert.match(HTML, /Checked 26 July 2026/);
  assert.match(HTML, /who\.int\/initiatives\/medication-without-harm/);
  assert.match(HTML, /fda\.gov\/media\/88498\/download/);
  const blocks = Array.from(HTML.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), match => JSON.parse(match[1]));
  assert.deepEqual(blocks.map(block => block['@type']), ['WebApplication', 'BreadcrumbList', 'FAQPage']);
});
