'use strict';

const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const engine = require('../tools/genotype-checker/haemoglobin-result-verification-engine.js');

function verify(overrides = {}) {
  return engine.verify({
    reportedResult: 'AS',
    testMethod: 'hplc',
    testDate: '2026-07-20',
    confirmationStatus: 'final',
    ...overrides
  });
}

test('recognises only the narrow supported A/S/C notation set', () => {
  for (const code of ['AA', 'AS', 'AC', 'SS', 'SC', 'CC']) {
    assert.equal(engine.canonicalNotation(code), code);
    assert.equal(engine.canonicalNotation(`Hb ${code[0]}/${code[1]}`), code);
  }
  for (const unsupported of ['SA', 'CA', 'A2', 'Sβ+', 'trait', 'AS?', '']) {
    assert.equal(engine.canonicalNotation(unsupported), null);
  }
});

test('returns one-result context without inheritance outputs', () => {
  const result = verify();
  assert.equal(result.ok, true);
  assert.equal(result.canonicalCode, 'AS');
  assert.equal(result.notationStatus, 'recognised-limited-notation');
  assert.equal(result.testMethodLabel, 'High-performance liquid chromatography (HPLC)');
  assert.equal(result.confirmationStatusLabel, 'Final laboratory report');
  assert.equal(result.flags.length, 0);
  assert.doesNotMatch(JSON.stringify(result), /resultOne|resultTwo|alleles|cells|outcomes|percentage|punnett/i);
});

test('unsupported notation is never guessed and gets laboratory questions', () => {
  const result = verify({ reportedResult: 'Sβ+', testMethod: 'unknown', confirmationStatus: 'unsure', testDate: '' });
  assert.equal(result.ok, true);
  assert.equal(result.canonicalCode, null);
  assert.equal(result.notationStatus, 'unsupported-or-ambiguous-notation');
  assert.match(result.explanation, /cannot safely map/i);
  assert.match(result.flags.join(' '), /Do not translate, reorder or guess/i);
  assert.match(result.questions.join(' '), /What does every letter/i);
});

test('preliminary and unknown-method results receive confirmation flags', () => {
  const result = verify({ testMethod: 'unknown', confirmationStatus: 'preliminary' });
  assert.match(result.flags.join(' '), /method is not recorded/i);
  assert.match(result.flags.join(' '), /confirmatory follow-up/i);
  assert.match(result.questions.join(' '), /final laboratory-confirmed result/i);
});

test('invalid and future dates are rejected', () => {
  assert.equal(verify({ testDate: '2026-02-31' }).ok, false);
  assert.equal(verify({ testDate: '2999-01-01' }).ok, false);
  assert.equal(verify({ reportedResult: '' }).ok, false);
});

test('export is a verification checklist with explicit safety boundary', () => {
  const text = engine.toText(verify());
  assert.match(text, /Result Verification Checklist/);
  assert.match(text, /does not confirm a result/i);
  assert.match(text, /genetic counsellor/i);
  assert.doesNotMatch(text, /compatible|safe match|danger|25%|50%|100%/i);
});

test('page contract is one-result, local-first and explicitly hands inheritance off', () => {
  const html = fs.readFileSync(path.join(root, 'tools/genotype-checker/index.html'), 'utf8');
  assert.match(html, /One-report verification checklist/i);
  assert.match(html, /reported-result/);
  assert.match(html, /test-method/);
  assert.match(html, /test-date/);
  assert.match(html, /confirmation-status/);
  assert.match(html, /href="\/tools\/sickle-cell\/"/);
  assert.match(html, /Print or save as PDF/);
  assert.doesNotMatch(html, /result-one|result-two|Punnett square|Four equally likely|inheritance-form|fonts\.googleapis/i);
  assert.equal((html.match(/id="reported-result"/g) || []).length, 1);

  const js = fs.readFileSync(path.join(root, 'tools/genotype-checker/haemoglobin-result-verification-vip.js'), 'utf8');
  assert.doesNotMatch(js, /\b(fetch|XMLHttpRequest|localStorage|sessionStorage)\b/);
});

test('English registry row is distinct from the inheritance explorer', () => {
  const registry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
  const row = registry.split(/\r?\n/).find((line) => line.includes("{ id: 'genotype-checker',"));
  assert.ok(row);
  assert.match(row, /Haemoglobin Result Verification Guide/);
  assert.match(row, /one reported haemoglobin result/i);
  assert.match(row, /without diagnosis or inheritance calculation/i);
  assert.doesNotMatch(row, /Punnett|two lab-confirmed|inheritance outcomes/i);
});

test('AI context hash and one-result boundary are internally consistent', () => {
  const context = JSON.parse(fs.readFileSync(path.join(root, 'data/ai/tool-context/genotype-checker.json'), 'utf8'));
  const digest = crypto.createHash('sha256').update(context.staticText).digest('hex');
  assert.equal(context.legacyTextSha256, `sha256:${digest}`);
  assert.equal(context.status, 'unverified-static');
  assert.match(context.staticText, /one reported haemoglobin/i);
  assert.match(context.staticText, /never guess unsupported notation/i);
  assert.match(context.staticText, /without diagnosis or inheritance calculation|never.*calculate inheritance/i);
});
