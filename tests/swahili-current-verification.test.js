'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const { canonicalJson, sourceFingerprint } = require('../scripts/lib/source-fingerprint');
const { ROOT, loadVerification, collectInputs, snapshot, evaluateCurrent } = require('../scripts/lib/swahili-free-app-verification');
const { browserResults, runChecks, buildRunReceipts, mergeReceipts } = require('../scripts/run-swahili-free-app-verification');
const check = { id: 'synthetic-pdf', file: 'tests/e2e/synthetic.spec.js', title: 'synthetic parser check', kind: 'browser', features: ['pdf-parser'], exports: ['pdf'] };
const fingerprint = { algorithm: 'sha256', value: 'b'.repeat(64), files: [{ path: 'synthetic.html', sha256: 'c'.repeat(64) }], missing: [] };
const row = { englishId: 'synthetic', state: 'native-candidate', primarySwahiliRoute: '/sw/synthetic', ambiguity: null };
function fixture() {
  return {
    app: { id: 'synthetic', swahiliRoute: '/sw/synthetic/', exports: ['pdf'], verification: { scope: 'synthetic', checks: [check],
      editorialReview: { status: 'pending' }, workflowReview: { status: 'pending' }, unresolvedDefects: [] } },
    receipt: { locale: 'sw', englishId: 'synthetic', swahiliRoute: '/sw/synthetic/', testedRevision: 'a'.repeat(40), workspaceDirty: true,
      startedAt: '2026-10-05T00:00:00Z', finishedAt: '2026-10-05T00:01:00Z', executionStatus: 'completed',
      fingerprint: structuredClone(fingerprint), sourceChangedDuringRun: false, runFailed: false,
      checks: [{ id: check.id, file: check.file, title: check.title, status: 'passed' }] }
  };
}
const evaluate = (app, receipt, current = fingerprint, owner = row) => evaluateCurrent(owner, app, receipt, current);

test('historical acceptance never supplies current source-bound execution or pending reviews', () => {
  const { app, receipt } = fixture();
  assert.equal(evaluate(null, { accepted: true }).status, 'needs-revalidation');
  assert.equal(evaluate(app, null).status, 'not-run');
  assert.equal(evaluate(app, receipt).status, 'partial');
  assert.equal(evaluate(app, receipt).workflowStatus, 'verified');
  const approved = { status: 'approved', reviewer: 'Synthetic reviewer', reviewedAt: '2026-10-05', evidence: 'synthetic.json', notYetProved: [] };
  app.verification.editorialReview = approved; app.verification.workflowReview = approved;
  assert.equal(evaluate(app, receipt).status, 'verified');
  assert.equal(evaluate(app, receipt, fingerprint, { ...row, state: 'localized-shell-candidate' }).status, 'partial');
});

test('unbound old receipts, manifest changes and source drift cannot retain current passing evidence', () => {
  const { app, receipt } = fixture();
  delete receipt.fingerprint; receipt.accepted = true;
  assert.equal(evaluate(app, receipt).status, 'needs-revalidation');
  receipt.fingerprint = structuredClone(fingerprint);
  assert.equal(evaluate(app, receipt, { ...fingerprint, value: 'd'.repeat(64) }).status, 'needs-revalidation');
  receipt.fingerprint.files[0].sha256 = 'd'.repeat(64);
  assert.equal(evaluate(app, receipt).status, 'needs-revalidation');
  receipt.fingerprint = structuredClone(fingerprint); receipt.sourceChangedDuringRun = true;
  assert.equal(evaluate(app, receipt).status, 'needs-revalidation');
});

test('actual English/Swahili/template/lexicon bytes invalidate selectively without altering historical evidence', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'afrotools-sw-verification-'));
  t.after(() => {
    assert.ok(path.resolve(temp).startsWith(`${path.resolve(os.tmpdir())}${path.sep}afrotools-sw-verification-`));
    fs.rmSync(temp, { recursive: true });
  });
  const files = ['english.html', 'swahili.html', 'template.js', 'lexicon.json'];
  for (const file of files) fs.writeFileSync(path.join(temp, file), file);
  const history = { accepted: 1256, receipt: 'dated-historical.json' };
  const before = sourceFingerprint(temp, files, { owner: 'cv' });
  assert.equal(sourceFingerprint(temp, [...files].reverse(), { owner: 'cv' }).value, before.value);
  for (const file of files) {
    fs.writeFileSync(path.join(temp, file), `${file} changed`);
    assert.notEqual(sourceFingerprint(temp, files, { owner: 'cv' }).value, before.value);
    fs.writeFileSync(path.join(temp, file), file);
  }
  const invoice = sourceFingerprint(temp, ['english.html', 'lexicon.json'], { owner: 'invoice' });
  fs.writeFileSync(path.join(temp, 'template.js'), 'changed template');
  assert.equal(sourceFingerprint(temp, ['english.html', 'lexicon.json'], { owner: 'invoice' }).value, invoice.value);
  assert.deepEqual(history, { accepted: 1256, receipt: 'dated-historical.json' });
  assert.throws(() => sourceFingerprint(temp, ['../escape'], {}), /escapes/);
  assert.equal(sourceFingerprint(temp, ['missing.js'], {}).value, null);
  assert.equal(canonicalJson({ b: 1, a: 2 }), canonicalJson({ a: 2, b: 1 }));
});

test('real invoice/CV contracts bind shared/local owners, review evidence and missing inputs', () => {
  for (const app of loadVerification().apps.values()) {
    const before = snapshot(app);
    assert.deepEqual(before.missing, []);
    assert.ok(collectInputs(app).includes('assets/js/pages/sw-document-pdf-localizer.js'));
    const edited = structuredClone(app); edited.verification.scope += ' changed scope';
    assert.notEqual(snapshot(edited).value, before.value);
    edited.verification.inputs.push('missing-source.js'); assert.equal(snapshot(edited).value, null);
    const review = structuredClone(app); review.verification.editorialReview.evidence = 'missing-native-review.json';
    assert.ok(snapshot(review).missing.includes('missing-native-review.json'));
  }
});

test('failed, timed out, interrupted, skipped and missing final checks fail closed', () => {
  const { app, receipt } = fixture(); receipt.formats = { pdf: { accepted: true } };
  for (const status of ['failed', 'timedOut', 'interrupted']) {
    receipt.checks[0].status = status; assert.equal(evaluate(app, receipt).status, 'blocked');
  }
  receipt.checks[0].status = 'skipped'; assert.equal(evaluate(app, receipt).status, 'not-run');
  receipt.checks = []; assert.equal(evaluate(app, receipt).status, 'not-run');
  receipt.checks = [{ ...check, status: 'passed' }]; receipt.runFailed = true; assert.equal(evaluate(app, receipt).status, 'blocked');
  receipt.runFailed = false; receipt.executionStatus = 'running'; receipt.finishedAt = null;
  assert.equal(evaluate(app, receipt).status, 'not-run');
});

test('owner mismatch, ambiguity, missing source and unresolved defects remain explicit blockers', () => {
  const { app, receipt } = fixture();
  receipt.swahiliRoute = '/sw/wrong'; assert.equal(evaluate(app, receipt).status, 'blocked'); receipt.swahiliRoute = app.swahiliRoute;
  for (const owner of [{ ...row, ownerConflict: true }, { ...row, ambiguity: {} }, { ...row, state: 'alias-utility' }]) assert.equal(evaluate(app, receipt, fingerprint, owner).status, 'blocked');
  assert.equal(evaluate(app, receipt, { ...fingerprint, value: null, missing: ['engine.js'] }).status, 'blocked');
  app.verification.unresolvedDefects.push({ id: 'synthetic-privacy-defect', status: 'open' });
  const result = evaluate(app, receipt); assert.equal(result.status, 'blocked'); assert.equal(result.workflowStatus, 'verified');
  assert.ok(result.reasons.includes('unresolved-defect'));
});

test('receipt validation rejects duplicate checks and missing revision/metadata; export gaps remain partial', () => {
  const { app, receipt } = fixture();
  app.exports.push('zip'); assert.equal(evaluate(app, receipt).workflowStatus, 'partial'); app.exports.pop();
  receipt.checks.push({ ...receipt.checks[0] }); assert.equal(evaluate(app, receipt).status, 'blocked'); receipt.checks.pop();
  receipt.testedRevision = 'unverified'; assert.equal(evaluate(app, receipt).status, 'blocked'); receipt.testedRevision = 'a'.repeat(40);
  delete receipt.workspaceDirty; assert.equal(evaluate(app, receipt).status, 'blocked');
});

test('browser intake requires exact file/title and one final pass; retries/global errors/empty output cannot pass', () => {
  const report = (status, results, file = check.file) => ({ suites: [{ specs: [{ title: check.title, file, tests: [{ status, results }] }] }] });
  assert.equal(browserResults(report('expected', [{ status: 'passed' }]), [check], 0)[0].status, 'passed');
  const relative = report('expected', [{ status: 'passed' }], 'synthetic.spec.js'); relative.config = { rootDir: 'C:/synthetic-repo/tests/e2e' };
  assert.equal(browserResults(relative, [check], 0)[0].status, 'passed', 'Playwright emits file names relative to its declared test root');
  assert.equal(browserResults(report('expected', [{ status: 'passed' }]), [check], 1)[0].status, 'passed', 'independent route failures do not falsify a final passed check');
  assert.equal(browserResults(report('expected', [{ status: 'passed' }], 'tests/e2e/wrong.spec.js'), [check], 0)[0].status, 'not-run');
  assert.equal(browserResults(report('flaky', [{ status: 'failed' }, { status: 'passed' }]), [check], 0)[0].status, 'failed');
  for (const status of ['timedOut', 'interrupted']) assert.equal(browserResults(report('unexpected', [{ status }]), [check], 1)[0].status, status);
  assert.equal(browserResults(report('skipped', []), [check], 0)[0].status, 'skipped');
  assert.equal(browserResults({ suites: [] }, [check], 0)[0].status, 'not-run');
  assert.equal(browserResults({ suites: [] }, [check], 1)[0].status, 'failed');
  assert.equal(browserResults({ ...report('expected', [{ status: 'passed' }]), errors: [{}] }, [check], 1)[0].status, 'failed');
  assert.equal(browserResults(report('expected', [{ status: 'passed' }]), [check], 0, true)[0].status, 'failed');
});

test('runner rejects malformed/empty successful processes and suppresses old category receipt writes', async () => {
  const { app } = fixture();
  const result = await runChecks([app], { quiet: true, execute: async (args, root, env) => {
    assert.ok(args.includes('--retries=0')); assert.equal(env.SW_DOCUMENT_PDF_IDS, 'synthetic');
    assert.equal(env.AFROTOOLS_SW_CURRENT_VERIFICATION, '1'); assert.equal(env.AFROTOOLS_TEST_DISABLE_ANALYTICS, '1');
    return { status: 0, stdout: '' };
  } });
  assert.equal(result.get(check.id).status, 'failed');
  const empty = await runChecks([app], { quiet: true, execute: async () => ({ status: 0, stdout: '{"suites":[]}' }) });
  assert.equal(empty.get(check.id).status, 'not-run');
});

test('starting a selected rerun replaces old green evidence, preserves unrelated rows, and detects source drift', () => {
  const context = loadVerification(), apps = [...context.apps.values()];
  const before = new Map(apps.map(app => [app.id, snapshot(app)]));
  const metadata = { testedRevision: 'a'.repeat(40), testedTree: 'b'.repeat(40), workspaceDirty: true, startedAt: '2026-10-05T00:00:00Z' };
  const running = buildRunReceipts(apps, before, new Map(), metadata);
  assert.ok(running.every(row => row.executionStatus === 'running' && row.finishedAt === null && row.checks.every(check => check.status === 'not-run')));
  const previous = new Map([['untouched', { englishId: 'untouched', accepted: true }], [apps[0].id, { englishId: apps[0].id, accepted: true }]]);
  const combined = mergeReceipts(previous, [apps[0].id], [running[0]]);
  assert.deepEqual(combined.find(row => row.englishId === 'untouched'), { englishId: 'untouched', accepted: true });
  assert.equal(combined.find(row => row.englishId === apps[0].id).executionStatus, 'running');
  before.set(apps[0].id, { ...before.get(apps[0].id), value: 'd'.repeat(64) });
  assert.equal(buildRunReceipts(apps, before, new Map(), metadata)[0].sourceChangedDuringRun, true);
});

test('generated inventory reconciles 1256 historical apps separately from current states and preserves dated receipts', () => {
  const historicalFiles = ['data/audits/swahili-free-app-acceptance.json', 'reports/swahili-document-pdf-browser-receipts.json', 'reports/swahili-document-pdf-export-acceptance.json'];
  const before = sourceFingerprint(ROOT, historicalFiles, { historical: true });
  const report = require('../scripts/build-swahili-free-app-parity-inventory').buildReport();
  assert.equal(report.totals.accepted, 1256); assert.equal(report.totals.historicallyAccepted, 1256);
  assert.equal(report.totals.currentlyVerified, 0);
  assert.equal(Object.values(report.totals.currentVerificationCounts).reduce((a, b) => a + b, 0), 1256);
  assert.equal(report.rows.filter(row => row.currentVerification.reasons.includes('historical-evidence-is-not-source-bound')).length, 1254);
  assert.ok(report.rows.every(row => row.accepted === row.historicalAccepted));
  assert.equal(sourceFingerprint(ROOT, historicalFiles, { historical: true }).value, before.value);
});
