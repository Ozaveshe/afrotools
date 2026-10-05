'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');
const { canonicalJson, sourceFingerprint } = require('../scripts/lib/source-fingerprint');
const { evaluateCurrent, loadVerification, snapshot, collectInputs } = require('../scripts/lib/french-free-app-verification');
const { browserResults, runChecks } = require('../scripts/run-french-free-app-verification');

const sha = 'a'.repeat(64);
const row = { englishId: 'cv-builder', primaryFrenchRoute: '/fr/tools/generateur-cv', state: 'native-candidate', ambiguity: null };
const check = { id: 'cv-export', kind: 'browser', file: 'tests/e2e/example.spec.js', title: 'CV export', features: ['export'], exports: ['pdf'] };
const fingerprint = { algorithm: 'sha256', value: sha, files: [{ path: 'tools/cv-builder/index.html', sha256: sha }], missing: [] };
function fixture() {
  return {
    app: { id: 'cv-builder', frenchRoute: '/fr/tools/generateur-cv/', exports: ['pdf'], verification: {
      scope: 'synthetic-proof', checks: [check], unresolvedRegressions: [],
      editorialReview: { status: 'approved', reviewer: 'Synthetic reviewer', reviewedAt: '2026-10-05', evidence: 'synthetic-review.json' },
      workflowReview: { status: 'approved', reviewer: 'Synthetic reviewer', reviewedAt: '2026-10-05', evidence: 'synthetic-review.json' }
    } },
    receipt: { englishId: 'cv-builder', locale: 'fr', frenchRoute: '/fr/tools/generateur-cv/', testedRevision: 'b'.repeat(40),
      finishedAt: '2026-10-05T00:00:00Z', executionStatus: 'completed', fingerprint: structuredClone(fingerprint), sourceChangedDuringRun: false,
      runFailed: false, checks: [{ id: check.id, file: check.file, title: check.title, status: 'passed' }], production: null }
  };
}
const evaluate = (app, receipt, current = fingerprint, owner = row) => evaluateCurrent(owner, app, receipt, current);

test('full source-bound execution plus recorded reviews is separate from historical acceptance', () => {
  const { app, receipt } = fixture();
  assert.equal(evaluate(app, receipt).status, 'verified');
  assert.equal(evaluate(undefined, receipt).status, 'needs-revalidation');
  assert.equal(evaluate(app, null).status, 'not-run');
  app.verification.editorialReview.status = 'pending';
  assert.equal(evaluate(app, receipt).status, 'partial');
  assert.equal(evaluate(app, receipt).workflowStatus, 'verified');
});

test('unbound legacy evidence cannot become current by existing on disk', () => {
  const { app, receipt } = fixture();
  delete receipt.fingerprint;
  receipt.accepted = true;
  assert.equal(evaluate(app, receipt).status, 'needs-revalidation');
  assert.deepEqual(evaluate(app, receipt).reasons, ['source-changed-since-execution']);
});

test('source drift and changed bytes during execution reopen verification', () => {
  const { app, receipt } = fixture();
  assert.equal(evaluate(app, receipt, { ...fingerprint, value: 'c'.repeat(64) }).status, 'needs-revalidation');
  receipt.sourceChangedDuringRun = true;
  assert.equal(evaluate(app, receipt).status, 'needs-revalidation');
  receipt.sourceChangedDuringRun = false;
  receipt.fingerprint.files[0].sha256 = 'c'.repeat(64);
  assert.equal(evaluate(app, receipt).status, 'needs-revalidation', 'a digest alone cannot hide a different source manifest');
});

test('source hashes change on English, French, template and shared lexicon edits without touching history', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-fr-verification-'));
  t.after(() => {
    assert.ok(path.resolve(temp).startsWith(`${path.resolve(os.tmpdir())}${path.sep}afrotools-fr-verification-`));
    fs.rmSync(temp, { recursive: true });
  });
  const files = ['english.html', 'french.html', 'template.js', 'lexicon.json'];
  for (const file of files) fs.writeFileSync(path.join(temp, file), file);
  const historical = { accepted: 1256, receipt: 'historical.json' };
  const before = sourceFingerprint(temp, files, { owner: 'cv-builder' });
  assert.equal(before.value, sourceFingerprint(temp, [...files].reverse(), { owner: 'cv-builder' }).value);
  for (const file of files) {
    fs.writeFileSync(path.join(temp, file), `${file} changed`);
    assert.notEqual(sourceFingerprint(temp, files, { owner: 'cv-builder' }).value, before.value, file);
    fs.writeFileSync(path.join(temp, file), file);
  }
  assert.deepEqual(historical, { accepted: 1256, receipt: 'historical.json' });
  assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
  assert.throws(() => sourceFingerprint(temp, ['../escape'], {}), /escapes repository/);
  assert.equal(sourceFingerprint(temp, ['missing.js'], {}).value, null);
});

test('an edited source contract or missing declared file invalidates the real invoice/CV snapshots', () => {
  const context = loadVerification();
  for (const app of context.apps.values()) {
    const before = snapshot(app);
    assert.deepEqual(before.missing, []);
    assert.ok(collectInputs(app).includes('assets/js/lib/fr-document-pdf-localizer.js'));
    const changed = structuredClone(app);
    changed.description += ' Changed source label';
    assert.notEqual(snapshot(changed).value, before.value);
    changed.verification.inputs.push('missing-current-proof.js');
    assert.equal(snapshot(changed).value, null);
    const unprovedReview = structuredClone(app);
    unprovedReview.verification.editorialReview = { status: 'approved', reviewer: 'Synthetic reviewer', reviewedAt: '2026-10-05', evidence: 'missing-human-review.json' };
    assert.ok(snapshot(unprovedReview).missing.includes('missing-human-review.json'), 'a review reference must bind to actual evidence bytes');
  }
});

test('shared lexicon edits reopen both owners while a CV-only template edit leaves invoice evidence unchanged', (t) => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-fr-impact-'));
  t.after(() => {
    assert.ok(path.resolve(temp).startsWith(`${path.resolve(os.tmpdir())}${path.sep}afrotools-fr-impact-`));
    fs.rmSync(temp, { recursive: true });
  });
  for (const file of ['invoice.html', 'cv.html', 'lexicon.json', 'cv-template.js']) fs.writeFileSync(path.join(temp, file), 'synthetic source');
  const invoice = () => sourceFingerprint(temp, ['invoice.html', 'lexicon.json'], { id: 'invoice-generator' }).value;
  const cv = () => sourceFingerprint(temp, ['cv.html', 'lexicon.json', 'cv-template.js'], { id: 'cv-builder' }).value;
  const before = { invoice: invoice(), cv: cv() };
  fs.writeFileSync(path.join(temp, 'cv-template.js'), 'changed CV template');
  assert.equal(invoice(), before.invoice);
  assert.notEqual(cv(), before.cv);
  fs.writeFileSync(path.join(temp, 'lexicon.json'), 'changed shared vocabulary');
  assert.notEqual(invoice(), before.invoice);
  assert.notEqual(cv(), before.cv);
});

test('failed final checks override any earlier format capture and skipped/missing checks never pass', () => {
  const { app, receipt } = fixture();
  receipt.formats = { pdf: { status: 'accepted' } };
  receipt.checks[0].status = 'failed';
  assert.equal(evaluate(app, receipt).status, 'blocked');
  receipt.checks[0].status = 'skipped';
  assert.equal(evaluate(app, receipt).status, 'not-run');
  receipt.checks = [];
  assert.equal(evaluate(app, receipt).status, 'not-run');
  receipt.checks = [{ id: check.id, file: check.file, title: check.title, status: 'passed' }];
  receipt.runFailed = true;
  assert.equal(evaluate(app, receipt).status, 'blocked');
});

test('owner mismatch, ambiguity, missing source and unresolved correctness/privacy issues block current acceptance', () => {
  const { app, receipt } = fixture();
  receipt.frenchRoute = '/fr/tools/wrong-owner';
  assert.equal(evaluate(app, receipt).status, 'blocked');
  receipt.frenchRoute = app.frenchRoute;
  for (const owner of [{ ...row, ambiguity: { routes: ['a', 'b'] } }, { ...row, ownerConflict: true }, { ...row, state: 'alias-utility' }]) {
    assert.equal(evaluate(app, receipt, fingerprint, owner).status, 'blocked');
  }
  assert.equal(evaluate(app, receipt, { ...fingerprint, value: null, missing: ['engine.js'] }).status, 'blocked');
  app.verification.unresolvedRegressions.push({ id: 'synthetic-privacy-regression', dimension: 'privacy', status: 'open' });
  const result = evaluate(app, receipt);
  assert.equal(result.status, 'blocked');
  assert.equal(result.workflowStatus, 'verified');
  assert.ok(result.reasons.includes('unresolved-regression'));
});

test('an incomplete advertised export matrix cannot grant full current verification', () => {
  const { app, receipt } = fixture();
  app.exports.push('zip');
  assert.equal(evaluate(app, receipt).status, 'partial');
  assert.ok(evaluate(app, receipt).reasons.includes('advertised-export-is-not-proved'));
});

test('interrupted execution and malformed duplicate receipts cannot retain an old passing result', () => {
  const { app, receipt } = fixture();
  receipt.executionStatus = 'running';
  receipt.finishedAt = null;
  assert.equal(evaluate(app, receipt).status, 'not-run');
  receipt.executionStatus = 'completed';
  receipt.finishedAt = '2026-10-05T00:00:00Z';
  receipt.checks.push({ ...receipt.checks[0] });
  assert.equal(evaluate(app, receipt).status, 'blocked');
});

test('browser result intake requires one final passed test, rejects failures, retries, skips and zero matches', () => {
  const report = (status, results) => ({ suites: [{ specs: [{ title: check.title, tests: [{ status, results }] }] }] });
  assert.equal(browserResults(report('expected', [{ status: 'passed' }]), [check], 0)[0].status, 'passed');
  assert.equal(browserResults(report('unexpected', [{ status: 'failed' }]), [check], 1)[0].status, 'failed');
  assert.equal(browserResults(report('flaky', [{ status: 'failed' }, { status: 'passed' }]), [check], 0)[0].status, 'failed');
  assert.equal(browserResults(report('skipped', []), [check], 0)[0].status, 'skipped');
  assert.equal(browserResults({ suites: [] }, [check], 0)[0].status, 'not-run');
  assert.equal(browserResults({ suites: [] }, [check], 1)[0].status, 'failed');
  assert.equal(browserResults(report('expected', [{ status: 'passed' }]), [check], 1)[0].status, 'passed', 'another route failing must not falsify this route final result');
  const fatal = report('expected', [{ status: 'passed' }]);
  fatal.errors = [{ message: 'synthetic global failure' }];
  assert.equal(browserResults(fatal, [check], 1)[0].status, 'failed');
});

test('the node execution adapter rejects file-existence-only and empty successful processes', () => {
  const { app } = fixture();
  app.verification.checks = [{ ...check, kind: 'node' }];
  const run = (stdout, status = 0) => runChecks([app], { quiet: true, execute: () => ({ status, stdout }) }).get(check.id).status;
  assert.equal(run(''), 'failed');
  assert.equal(run('# tests 0\n# fail 0'), 'failed');
  assert.equal(run('# tests 3\n# fail 0'), 'passed');
  assert.equal(run('# tests 3\n# fail 1', 1), 'failed');
});
