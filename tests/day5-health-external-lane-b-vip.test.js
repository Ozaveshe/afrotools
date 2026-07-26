'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const routes = [
  ['tools/diabetes-risk', 'diabetes-risk'],
  ['health/bmi-calculator', 'bmi-measurement-quality'],
  ['tools/bmi-calculator', 'bmi-calculator'],
  ['tools/waist-hip-ratio', 'waist-hip-ratio'],
  ['tools/water-intake', 'water-intake'],
  ['tools/malaria-risk', 'malaria-risk'],
  ['tools/cholera-risk', 'cholera-risk'],
  ['tools/ebola-checklist', 'ebola-checklist'],
  ['tools/water-quality', 'water-quality'],
  ['tools/hiv-treatment-cost', 'hiv-treatment-cost'],
  ['tools/tb-tracker', 'tb-tracker'],
  ['tools/hep-b-screening', 'hep-b-screening']
];

test('all assigned routes have local, accessible, non-gated safety contracts', () => {
  for (const [route, context] of routes) {
    const html = fs.readFileSync(path.join(root, route, 'index.html'), 'utf8');
    assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\//, route);
    assert.match(html, /<script type="application\/ld\+json">/, route);
    assert.match(html, /reviewed 26 July 2026/i, route);
    assert.match(html, /Download TXT/, route);
    assert.match(html, /Print \/ save PDF/, route);
    assert.match(html, /role="alert"|aria-live=/, route);
    assert.doesNotMatch(html, /fonts\.googleapis|fonts\.gstatic|cdn\.jsdelivr|cdnjs|unpkg/i, route);
    assert.doesNotMatch(html, /email-gated|sendBeacon|localStorage|sessionStorage|fetch\s*\(|XMLHttpRequest/i, route);
    const data = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context', `${context}.json`), 'utf8'));
    assert.equal(data.schemaVersion, 1, context);
    assert.equal(data.toolKey, context, context);
    assert.equal(data.status, 'unverified-static', context);
    assert.match(data.staticText, /local|sensitive/i, context);
    assert.match(data.staticText, /do not|never/i, context);
    const hash = crypto.createHash('sha256').update(data.staticText).digest('hex');
    assert.equal(data.legacyTextSha256, `sha256:${hash}`, context);
  }
});

test('diabetes screening score handles threshold and maximum edge cases', () => {
  const engine = require('../tools/diabetes-risk/diabetes-risk-engine.js');
  const low = engine.score({ age: 25, sex: 'female', heightCm: 170, weightKg: 60 });
  const standardBand = engine.score({ age: 25, sex: 'female', heightCm: 200, weightKg: 98 });
  const adjustedBand = engine.score({ age: 25, sex: 'female', heightCm: 200, weightKg: 98, asianAmericanThreshold: true });
  const pregnancyPriority = engine.score({ age: 25, sex: 'female', heightCm: 170, weightKg: 60, pregnant: true });
  const high = engine.score({ age: 65, sex: 'female', heightCm: 160, weightKg: 110, gestational: true, familyHistory: true, highBloodPressure: true, inactive: true });
  assert.equal(low.total, 0);
  assert.equal(adjustedBand.total, standardBand.total + 1);
  assert.match(pregnancyPriority.band, /Do not rely/);
  assert.equal(high.total, 10);
  assert.match(high.warning, /not a diagnosis/i);
});

test('the two BMI routes have distinct engines and user contracts', () => {
  const measurement = require('../health/bmi-calculator/bmi-measurement-engine.js');
  const quick = require('../tools/bmi-calculator/bmi-engine.js');
  const quality = measurement.assess({ heightCm: 180, repeatHeightCm: 179, weightKg: 80, repeatWeightKg: 82, sameConditions: 'yes' });
  const snapshot = quick.calculate({ audience: 'adult', units: 'imperial', feet: 5, inches: 10, pounds: 180 });
  const metric = quick.calculate({ audience: 'adult', units: 'metric', heightCm: 177.8, weightKg: 81.6466266 });
  assert.equal(quality.weightDifference, 2);
  assert.equal(quality.heightDifference, 1);
  assert.ok(quality.low < quality.bmi && quality.high > quality.bmi);
  // The imperial branch follows the public 703-factor convention, so allow
  // the small difference from an exact metric conversion of the same values.
  assert.ok(Math.abs(metric.bmi - snapshot.bmi) < 0.01);
  assert.equal(snapshot.formula, '703 × pounds ÷ inches²');
  assert.match(fs.readFileSync(path.join(root, 'health/bmi-calculator/index.html'), 'utf8'), /measurement quality/i);
  assert.match(fs.readFileSync(path.join(root, 'tools/bmi-calculator/index.html'), 'utf8'), /metric or imperial/i);
});

test('waist-to-hip calculation never turns a threshold into a diagnosis', () => {
  const engine = require('../tools/waist-hip-ratio/waist-hip-engine.js');
  const result = engine.calculate({ units: 'cm', applicability: 'adult', waist: 85, hip: 100, reference: 'women' });
  assert.equal(result.ratio, 0.85);
  assert.match(result.referenceLabel, /At or above/);
  assert.match(result.warning, /cannot diagnose/i);
});

test('fluid log only compares with an explicitly supplied clinical target', () => {
  const engine = require('../tools/water-intake/fluid-log-engine.js');
  assert.equal(engine.total({ entries: [{ type: 'water', volumeMl: 1500 }, { type: 'other', volumeMl: 500 }] }).targetMl, null);
  assert.match(engine.total({ entries: [{ type: 'water', volumeMl: 1200 }, { type: 'other', volumeMl: 300 }], clinicalTargetMl: 1800, targetConfirmed: true }).targetContext, /300 mL below/);
});

test('malaria, cholera and Ebola engines prioritise urgent care and never self-clear', () => {
  const malaria = require('../tools/malaria-risk/malaria-urgency-engine.js');
  const cholera = require('../tools/cholera-risk/cholera-urgency-engine.js');
  const ebola = require('../tools/ebola-checklist/ebola-action-engine.js');
  assert.match(malaria.assess({ exposure: 'yes', testStatus: 'none', symptomTiming: 'today', fever: true }).level, /same-day/);
  assert.match(malaria.assess({ exposure: 'no', testStatus: 'negative', symptomTiming: 'today', confusion: true }).level, /Emergency/);
  assert.match(cholera.assess({ timing: 'none', drinking: 'normal', frequent: true }).level, /Urgent/);
  assert.match(cholera.assess({ timing: 'today', drinking: 'normal', watery: true }).action, /packaged oral rehydration solution/i);
  assert.match(cholera.assess({ timing: 'none', drinking: 'normal' }).warning, /not reassurance/i);
  assert.match(ebola.assess({ exposureWindow: 'within21', outbreakContext: 'unknown', symptomOnset: 'today', contact: true, fever: true }).level, /Immediate separation/);
  assert.match(ebola.assess({ exposureWindow: 'none', outbreakContext: 'no', symptomOnset: 'none' }).warning, /not proof/i);
});

test('water result worksheet cannot certify untested or passing water', () => {
  const engine = require('../tools/water-quality/water-result-engine.js');
  assert.equal(engine.review({ labStatus: 'none', sampleScope: 'unknown', advisory: 'unknown' }).level, 'Safety cannot be assessed');
  const passing = engine.review({ labStatus: 'competent', sampleScope: 'drinking', advisory: 'none', ecoliStatus: 'not-detected', arsenic: 9, fluoride: 1.2, turbidity: 0.8 });
  const boundaries = engine.review({ labStatus: 'competent', sampleScope: 'drinking', advisory: 'none', ecoliStatus: 'not-detected', arsenic: 10, fluoride: 1.5, turbidity: 1 });
  assert.match(passing.action, /do not certify/i);
  assert.equal(boundaries.flags.filter((flag) => flag.status === 'pass').length, 4);
  assert.match(engine.review({ labStatus: 'competent', sampleScope: 'drinking', advisory: 'none', ecoliStatus: 'detected' }).level, /E\. coli/);
});

test('HIV cost worksheet is arithmetic only and rejects excess assistance', () => {
  const engine = require('../tools/hiv-treatment-cost/hiv-cost-engine.js');
  const result = engine.calculate({ currency: 'KES', clinic: 1000, labs: 500, transport: 300, other: 200, support: 750 });
  assert.equal(result.netMonthly, 1250);
  assert.equal(result.netAnnual, 15000);
  assert.throws(() => engine.calculate({ currency: 'USD', clinic: 1, labs: 0, transport: 0, other: 0, support: 2 }));
});

test('TB date tracker uses whole valid calendar days without treatment inference', () => {
  const engine = require('../tools/tb-tracker/tb-date-engine.js');
  const result = engine.review({ today: '2026-07-26', appointment: '2026-07-30', sample: '2026-07-25' });
  assert.equal(result.items[0].days, 4);
  assert.equal(result.items[1].days, -1);
  assert.match(result.warning, /Do not change, delay or stop TB care/i);
  assert.match(result.level, /need clinic confirmation/i);
  assert.equal(engine.review({ today: '2024-02-28', appointment: '2024-03-01' }).items[0].days, 2);
});

test('hepatitis B engine keeps testing, diagnosis and vaccination separate', () => {
  const engine = require('../tools/hep-b-screening/hep-b-pathway-engine.js');
  const pregnancy = engine.build({ reason: 'pregnancy', ageGroup: 'adult', exposureTiming: 'none', testing: 'none', diagnosis: 'none', vaccine: 'unknown' });
  const exposure = engine.build({ reason: 'exposure', ageGroup: 'adult', exposureTiming: '1-7', testing: 'partial', diagnosis: 'none', vaccine: 'incomplete' });
  const result = engine.build({ reason: 'result', ageGroup: 'adult', exposureTiming: 'none', testing: 'told-positive', diagnosis: 'clinician', vaccine: 'complete' });
  assert.deepEqual(pregnancy.paths.map((item) => item.title), ['1. Testing pathway', '2. Diagnosis pathway', '3. Vaccination pathway']);
  assert.match(pregnancy.paths[0].text, /during this pregnancy/);
  assert.match(exposure.urgency, /immediately/);
  assert.match(result.paths[1].text, /qualified clinician diagnosis is distinct/i);
});
