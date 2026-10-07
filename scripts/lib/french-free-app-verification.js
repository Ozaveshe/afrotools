'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { canonicalJson, repositoryPath, sourceFingerprint } = require('./source-fingerprint');

const ROOT = path.resolve(__dirname, '../..');
const CONFIG_PATH = 'data/localization/fr-document-pdf-parity.json';
const RECEIPTS_PATH = 'reports/french-free-app-current-verification-receipts.json';
const HELPER_INPUTS = [
  'scripts/lib/source-fingerprint.js',
  'scripts/lib/french-free-app-verification.js',
  'scripts/run-french-free-app-verification.js',
  'package.json',
  'package-lock.json',
  'playwright.config.js',
  'tests/support/static-server.js',
  'assets/js/components/tool-registry.js'
];

function loadVerification(root = ROOT) {
  const config = JSON.parse(fs.readFileSync(path.join(root, CONFIG_PATH), 'utf8'));
  const receiptFile = path.join(root, RECEIPTS_PATH);
  const receiptDocument = fs.existsSync(receiptFile)
    ? JSON.parse(fs.readFileSync(receiptFile, 'utf8'))
    : { schemaVersion: 1, locale: 'fr', rows: [] };
  if (receiptDocument.schemaVersion !== 1 || receiptDocument.locale !== 'fr' || !Array.isArray(receiptDocument.rows)) {
    throw new Error('Invalid French current-verification receipt document.');
  }
  const receipts = new Map();
  for (const receipt of receiptDocument.rows) {
    if (!receipt.englishId || receipts.has(receipt.englishId)) throw new Error('Duplicate or missing current-verification English ID.');
    receipts.set(receipt.englishId, receipt);
  }
  const ids = new Set();
  for (const app of config.apps.filter((entry) => entry.verification)) {
    const contract = app.verification;
    if (ids.has(app.id) || !Array.isArray(contract.checks) || !contract.checks.length
      || new Set(contract.checks.map((check) => check.id)).size !== contract.checks.length
      || contract.checks.some((check) => !check.id || !check.title || !check.file
        || !['node', 'browser'].includes(check.kind) || !Array.isArray(check.features) || !check.features.length)) {
      throw new Error(`Invalid French current-verification contract: ${app.id}.`);
    }
    ids.add(app.id);
  }
  return { apps: new Map(config.apps.filter((app) => app.verification).map((app) => [app.id, app])), receipts };
}

// Capture direct served assets and their readable owners as well as explicitly
// declared lazy/runtime inputs. Missing direct assets are blockers, never omitted.
function servedInputs(app, root = ROOT) {
  const files = new Set([app.englishFile, app.frenchFile]);
  for (const page of [app.englishFile, app.frenchFile]) {
    const absolute = repositoryPath(root, page);
    if (!fs.existsSync(absolute)) continue;
    const html = fs.readFileSync(absolute, 'utf8');
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/gi)) {
      const reference = match[1].split(/[?#]/)[0];
      if (/^(?:https?:|\/\/|data:)/i.test(reference)) continue;
      const file = reference.startsWith('/') ? reference.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(page), reference));
      files.add(file);
    }
  }
  return [...files].sort();
}

function collectInputs(app, root = ROOT) {
  const files = new Set([...servedInputs(app, root), ...HELPER_INPUTS,
    ...app.verification.inputs, ...app.verification.generators,
    ...app.verification.checks.flatMap((check) => [check.file, ...(check.additionalFiles || [])])]);
  for (const review of [app.verification.editorialReview, app.verification.workflowReview]) {
    if (review && review.evidence) files.add(review.evidence);
  }
  // Generated JavaScript/CSS may have a separate source owner.
  for (const file of [...files]) {
    const plain = file.replace(/\.min\.(js|css)$/, '.$1');
    if (plain !== file && fs.existsSync(repositoryPath(root, plain))) files.add(plain);
    const readable = path.posix.join(path.posix.dirname(plain), 'src', path.posix.basename(plain));
    if (fs.existsSync(repositoryPath(root, readable))) files.add(readable);
  }
  return [...files].sort();
}

function snapshot(app, root = ROOT) {
  return sourceFingerprint(root, collectInputs(app, root), app);
}

function normalizeRoute(route) { return String(route || '').replace(/\/$/, ''); }

function evaluateCurrent(row, app, receipt, fingerprint) {
  const reasons = [];
  if (!app) return { status: 'needs-revalidation', workflowStatus: 'not-run', sourceFingerprint: null,
    testedRevision: null, reasons: ['historical-evidence-is-not-source-bound'] };
  const base = {
    status: 'needs-revalidation',
    workflowStatus: 'not-run',
    scope: app ? app.verification.scope : null,
    sourceFingerprint: fingerprint || null,
    testedRevision: receipt ? receipt.testedRevision || null : null,
    checkedAt: receipt ? receipt.finishedAt || null : null,
    executionReceipt: receipt ? RECEIPTS_PATH : null,
    checks: [],
    editorialReview: app ? app.verification.editorialReview : { status: 'not-recorded' },
    workflowReview: app ? app.verification.workflowReview : { status: 'not-recorded' },
    unresolvedRegressions: app ? app.verification.unresolvedRegressions : [],
    production: receipt ? receipt.production || null : null,
    reasons
  };
  function finish() {
    if (base.unresolvedRegressions.length) {
      base.status = 'blocked'; reasons.push('unresolved-regression');
    }
    return base;
  }
  if (row.state !== 'native-candidate' || row.ambiguity || row.ownerConflict
    || normalizeRoute(row.primaryFrenchRoute) !== normalizeRoute(app.frenchRoute)) {
    reasons.push('current-native-owner-is-missing-or-ambiguous');
  }
  if (!fingerprint || !fingerprint.value || fingerprint.missing.length) reasons.push('source-input-is-missing');
  if (reasons.length) { base.status = 'blocked'; return finish(); }
  if (!receipt) { base.status = 'not-run'; reasons.push('current-execution-receipt-is-missing'); return finish(); }
  if (receipt.locale !== 'fr' || receipt.englishId !== row.englishId
    || normalizeRoute(receipt.frenchRoute) !== normalizeRoute(row.primaryFrenchRoute)) {
    base.status = 'blocked'; reasons.push('receipt-owner-mismatch'); return finish();
  }
  if (!receipt.fingerprint || receipt.fingerprint.algorithm !== 'sha256' || receipt.fingerprint.value !== fingerprint.value
    || canonicalJson(receipt.fingerprint.files) !== canonicalJson(fingerprint.files)
    || receipt.sourceChangedDuringRun === true) {
    reasons.push('source-changed-since-execution'); return finish();
  }
  if (receipt.executionStatus === 'running') {
    base.status = 'not-run'; reasons.push('execution-did-not-complete'); return finish();
  }
  if (!/^[a-f0-9]{40}$/.test(receipt.testedRevision || '') || !receipt.finishedAt
    || typeof receipt.sourceChangedDuringRun !== 'boolean' || typeof receipt.runFailed !== 'boolean'
    || !Array.isArray(receipt.checks) || new Set(receipt.checks.map((check) => check.id)).size !== receipt.checks.length) {
    base.status = 'blocked'; reasons.push('invalid-execution-receipt'); return finish();
  }
  const byId = new Map(receipt.checks.map((check) => [check.id, check]));
  base.checks = app.verification.checks.map((contract) => {
    const check = byId.get(contract.id);
    const matched = check && check.file === contract.file && check.title === contract.title;
    return { id: contract.id, status: matched ? check.status : 'not-run', features: contract.features, exports: contract.exports || [] };
  });
  if (base.checks.some((check) => ['failed', 'timedOut', 'interrupted'].includes(check.status)) || receipt.runFailed === true) {
    base.status = 'blocked'; base.workflowStatus = 'failed'; reasons.push('execution-failed'); return finish();
  }
  if (base.checks.some((check) => check.status !== 'passed')) {
    base.status = base.checks.some((check) => check.status === 'passed') ? 'partial' : 'not-run';
    base.workflowStatus = base.status; reasons.push('required-checks-not-passed'); return finish();
  }
  const provedExports = new Set(base.checks.flatMap((check) => check.exports));
  if (app.exports.some((format) => !provedExports.has(format))) {
    base.status = 'partial'; base.workflowStatus = 'partial'; reasons.push('advertised-export-is-not-proved'); return finish();
  }
  base.workflowStatus = 'verified';
  const reviewPassed = (review) => review && review.status === 'approved'
    && review.reviewer && review.reviewedAt && review.evidence
    && !(review.notYetProved || []).length;
  if (!reviewPassed(base.editorialReview) || !reviewPassed(base.workflowReview)) {
    base.status = 'partial'; reasons.push('full-workflow-or-native-editor-review-pending'); return finish();
  }
  base.status = 'verified';
  return finish();
}

function currentVerification(row, context, root = ROOT) {
  const app = context.apps.get(row.englishId);
  return evaluateCurrent(row, app, context.receipts.get(row.englishId), app ? snapshot(app, root) : null);
}

module.exports = { CONFIG_PATH, RECEIPTS_PATH, ROOT, collectInputs, currentVerification, evaluateCurrent, loadVerification, servedInputs, snapshot };
