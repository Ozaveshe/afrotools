const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../tools/blood-pressure/blood-pressure-check-engine.js');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'tools/blood-pressure/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'tools/blood-pressure/blood-pressure-check.js'), 'utf8');
const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/blood-pressure.json'), 'utf8'));

assert.match(html, /<title>Blood Pressure Measurement Check \| AfroTools<\/title>/);
assert.match(html, /Readings taken at least 1 minute apart/);
assert.match(html, /Gave birth within the last 6 weeks/);
assert.match(html, /Sources checked: 26 July 2026/);
assert.match(html, /Nothing is saved or sent/);
assert.match(html, /assets\/js\/lib\/dark-mode\.js/);
assert.match(html, /id="afro-theme-fallback-toggle"[^>]+aria-label="Switch to dark mode"[^>]+aria-pressed="false"/);
assert.doesNotMatch(html, /fonts\.googleapis|cdn\.jsdelivr|cdnjs\.cloudflare|Chart\.js|Stage 1|Stage 2|Great!|healthy range|Track Your Blood Pressure|prescription/i);
assert.match(script, /window\.AfroTools\.darkMode\.toggle\(\)/);
assert.doesNotMatch(script, /(?:localStorage|sessionStorage)\s*\.\s*(?:setItem|getItem|removeItem|clear)|fetch\(|\/api\//);
assert.match(script, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
assert.match(context.staticText, /must never diagnose hypertension or pre-eclampsia/);
assert.match(context.staticText, /must not interpret paediatric readings/);
assert.strictEqual(context.schemaVersion, 1);
assert.strictEqual(context.status, 'unverified-static');
assert.match(context.legacyTextSha256, /^sha256:[a-f0-9]{64}$/);

function completeTechnique(overrides) {
  return Object.assign({
    context: 'adult',
    systolic1: '138',
    diastolic1: '86',
    systolic2: '136',
    diastolic2: '84',
    rested: true,
    positioned: true,
    cuff: true,
    quiet: true,
    urgentSymptoms: false
  }, overrides || {});
}

let result = engine.evaluate(completeTechnique());
assert.strictEqual(result.valid, true);
assert.strictEqual(result.band, 'adult-below-threshold');
assert.deepStrictEqual(result.average, { systolic: 137, diastolic: 85 });
assert.match(result.action, /not a diagnosis/);

result = engine.evaluate(completeTechnique({ systolic1: '142', diastolic1: '86' }));
assert.strictEqual(result.band, 'adult-review');
assert.match(result.action, /two different days/);

result = engine.evaluate(completeTechnique({
  systolic1: '184',
  diastolic1: '118',
  systolic2: '182',
  diastolic2: '121'
}));
assert.strictEqual(result.band, 'adult-very-high-repeat');
assert.match(result.action, /clinician immediately/);

result = engine.evaluate(completeTechnique({
  context: 'pregnant',
  systolic1: '145',
  diastolic1: '88',
  systolic2: '138',
  diastolic2: '84'
}));
assert.strictEqual(result.band, 'pregnancy-review');
assert.match(result.action, /maternity/);

result = engine.evaluate(completeTechnique({
  context: 'postpartum',
  systolic1: '159',
  diastolic1: '111',
  systolic2: '150',
  diastolic2: '100'
}));
assert.strictEqual(result.band, 'pregnancy-severe');
assert.match(result.action, /urgent maternity assessment/);

result = engine.evaluate(completeTechnique({ urgentSymptoms: true, systolic1: '110', diastolic1: '70', systolic2: '108', diastolic2: '68' }));
assert.strictEqual(result.band, 'emergency-symptoms');
assert.match(result.action, /Do not wait/);

result = engine.evaluate(completeTechnique({ rested: false }));
assert.strictEqual(result.band, 'repeat-technique');
assert.strictEqual(result.techniqueCount, 3);

assert.strictEqual(engine.evaluate(completeTechnique({ systolic1: '80', diastolic1: '80' })).valid, false);
assert.strictEqual(engine.evaluate(completeTechnique({ systolic1: '261' })).valid, false);

console.log('blood pressure measurement check VIP tests passed');
