'use strict';

const fs = require('node:fs');
const path = require('node:path');
// Shared prerequisite supplied by the French verification lane. Never fork it.
const { canonicalJson, repositoryPath, sourceFingerprint } = require('./source-fingerprint');
const ROOT = path.resolve(__dirname, '../..');
const CONFIG_PATH = 'data/localization/sw-current-verification.json';
const RECEIPTS_PATH = 'reports/swahili-free-app-current-verification-receipts.json';
const STATUSES = ['verified', 'partial', 'not-run', 'needs-revalidation', 'blocked'];
const HELPER_INPUTS = [CONFIG_PATH, 'scripts/lib/source-fingerprint.js',
  'scripts/lib/swahili-free-app-verification.js', 'scripts/run-swahili-free-app-verification.js',
  'scripts/build-swahili-free-app-parity-inventory.js',
  'tests/swahili-current-verification.test.js', 'package.json', 'package-lock.json',
  'playwright.config.js', 'tests/support/static-server.js', 'assets/js/components/tool-registry.js'];

function loadVerification(root = ROOT) {
  const config = JSON.parse(fs.readFileSync(path.join(root, CONFIG_PATH), 'utf8'));
  if (config.schemaVersion !== 1 || config.locale !== 'sw' || !Array.isArray(config.apps)) throw Error('Invalid Swahili verification contract.');
  const file = path.join(root, RECEIPTS_PATH);
  const document = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : { schemaVersion: 1, locale: 'sw', rows: [] };
  if (document.schemaVersion !== 1 || document.locale !== 'sw' || !Array.isArray(document.rows)) throw Error('Invalid Swahili execution receipt document.');
  const apps = new Map(), receipts = new Map(), checkIds = new Set();
  for (const app of config.apps) {
    if (!app.id || apps.has(app.id) || !app.verification?.checks?.length) throw Error('Missing or duplicate Swahili verification owner.');
    for (const check of app.verification.checks) {
      if (!check.id || checkIds.has(check.id) || !check.title || !check.file || check.kind !== 'browser' || !check.features?.length) throw Error('Invalid or duplicate Swahili verification check.');
      checkIds.add(check.id);
    }
    apps.set(app.id, app);
  }
  for (const receipt of document.rows) {
    if (!receipt.englishId || receipts.has(receipt.englishId)) throw Error('Missing or duplicate Swahili execution receipt.');
    receipts.set(receipt.englishId, receipt);
  }
  return { apps, receipts };
}

function directoryFiles(root, directory) {
  const absolute = repositoryPath(root, directory);
  if (!fs.existsSync(absolute)) return [directory]; // A declared missing directory is a blocker.
  return fs.readdirSync(absolute, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name)).flatMap(entry => {
    const file = path.posix.join(directory, entry.name);
    return entry.isDirectory() ? directoryFiles(root, file) : [file];
  });
}

function servedInputs(app, root = ROOT) {
  const files = new Set([app.englishFile, app.swahiliFile, ...(app.verification.servedFiles || [])]);
  for (const page of [app.englishFile, app.swahiliFile]) {
    const absolute = repositoryPath(root, page);
    if (!fs.existsSync(absolute)) continue;
    const html = fs.readFileSync(absolute, 'utf8');
    for (const match of html.matchAll(/<(?:script|link)\b[^>]*\b(?:src|href)=["']([^"']+\.(?:js|css)(?:\?[^"']*)?)["']/gi)) {
      const ref = match[1].split(/[?#]/)[0];
      if (/^(?:https?:|\/\/|data:)/i.test(ref)) continue;
      files.add(ref.startsWith('/') ? ref.slice(1) : path.posix.normalize(path.posix.join(path.posix.dirname(page), ref)));
    }
  }
  return [...files].sort();
}

function collectInputs(app, root = ROOT) {
  const files = new Set([...servedInputs(app, root), ...HELPER_INPUTS, ...app.verification.inputs,
    ...app.verification.generators, ...app.verification.checks.map(check => check.file),
    ...(app.verification.inputDirectories || []).flatMap(directory => directoryFiles(root, directory))]);
  for (const file of app.verification.optionalInputs || []) if (fs.existsSync(repositoryPath(root, file))) files.add(file);
  for (const directory of app.verification.optionalDirectories || []) if (fs.existsSync(repositoryPath(root, directory))) {
    for (const file of directoryFiles(root, directory)) files.add(file);
  }
  for (const review of [app.verification.editorialReview, app.verification.workflowReview]) if (review?.evidence) files.add(review.evidence);
  // Capture readable owners when a final integrated build introduces one.
  for (const file of [...files]) {
    const plain = file.replace(/\.min\.(js|css)$/, '.$1');
    if (plain !== file && fs.existsSync(repositoryPath(root, plain))) files.add(plain);
    const readable = path.posix.join(path.posix.dirname(plain), 'src', path.posix.basename(plain));
    if (fs.existsSync(repositoryPath(root, readable))) files.add(readable);
  }
  return [...files].sort();
}

function snapshot(app, root = ROOT) { return sourceFingerprint(root, collectInputs(app, root), app); }
const route = value => String(value || '').replace(/\/$/, '');

function evaluateCurrent(row, app, receipt, fingerprint) {
  if (!app) return { status: 'needs-revalidation', workflowStatus: 'not-run', sourceFingerprint: null,
    testedRevision: null, reasons: ['historical-evidence-is-not-source-bound'] };
  const result = { status: 'needs-revalidation', workflowStatus: 'not-run', scope: app.verification.scope,
    sourceFingerprint: fingerprint || null, testedRevision: receipt?.testedRevision || null,
    workspaceDirty: receipt?.workspaceDirty ?? null, checkedAt: receipt?.finishedAt || null,
    executionReceipt: receipt ? RECEIPTS_PATH : null, checks: [],
    editorialReview: app.verification.editorialReview, workflowReview: app.verification.workflowReview,
    unresolvedDefects: app.verification.unresolvedDefects || [], production: null, reasons: [] };
  const finish = () => {
    if (result.unresolvedDefects.some(issue => issue.status !== 'resolved')) {
      result.status = 'blocked'; result.reasons.push('unresolved-defect');
    }
    return result;
  };
  if (!['native-candidate', 'localized-shell-candidate'].includes(row.state) || row.ambiguity || row.ownerConflict || route(row.primarySwahiliRoute) !== route(app.swahiliRoute)) {
    result.status = 'blocked'; result.reasons.push('current-owner-is-missing-or-ambiguous'); return finish();
  }
  if (!fingerprint?.value || fingerprint.missing?.length) {
    result.status = 'blocked'; result.reasons.push('source-input-is-missing'); return finish();
  }
  if (!receipt) { result.status = 'not-run'; result.reasons.push('current-execution-receipt-is-missing'); return finish(); }
  if (receipt.locale !== 'sw' || receipt.englishId !== row.englishId || route(receipt.swahiliRoute) !== route(app.swahiliRoute)) {
    result.status = 'blocked'; result.reasons.push('receipt-owner-mismatch'); return finish();
  }
  if (receipt.fingerprint?.algorithm !== 'sha256' || receipt.fingerprint.value !== fingerprint.value
    || canonicalJson(receipt.fingerprint.files) !== canonicalJson(fingerprint.files) || receipt.sourceChangedDuringRun === true) {
    result.reasons.push('source-changed-since-execution'); return finish();
  }
  if (receipt.executionStatus === 'running') { result.status = 'not-run'; result.reasons.push('execution-did-not-complete'); return finish(); }
  if (!/^[a-f0-9]{40}$/.test(receipt.testedRevision || '') || !receipt.finishedAt || !receipt.startedAt
    || !['completed', 'interrupted'].includes(receipt.executionStatus) || typeof receipt.workspaceDirty !== 'boolean'
    || typeof receipt.sourceChangedDuringRun !== 'boolean' || typeof receipt.runFailed !== 'boolean'
    || !Array.isArray(receipt.checks) || new Set(receipt.checks.map(check => check.id)).size !== receipt.checks.length) {
    result.status = 'blocked'; result.reasons.push('invalid-execution-receipt'); return finish();
  }
  const byId = new Map(receipt.checks.map(check => [check.id, check]));
  result.checks = app.verification.checks.map(contract => {
    const check = byId.get(contract.id);
    return { id: contract.id, status: check?.file === contract.file && check.title === contract.title ? check.status : 'not-run',
      features: contract.features, exports: contract.exports || [] };
  });
  if (receipt.runFailed || receipt.executionStatus === 'interrupted'
    || result.checks.some(check => ['failed', 'timedOut', 'interrupted'].includes(check.status))) {
    result.status = 'blocked'; result.workflowStatus = 'failed'; result.reasons.push('execution-failed'); return finish();
  }
  if (result.checks.some(check => check.status !== 'passed')) {
    result.status = result.checks.some(check => check.status === 'passed') ? 'partial' : 'not-run';
    result.workflowStatus = result.status; result.reasons.push('required-checks-not-passed'); return finish();
  }
  const proved = new Set(result.checks.flatMap(check => check.exports));
  if (app.exports.some(format => !proved.has(format))) {
    result.status = 'partial'; result.workflowStatus = 'partial'; result.reasons.push('advertised-export-is-not-proved'); return finish();
  }
  result.workflowStatus = 'verified';
  const approved = review => review?.status === 'approved' && review.reviewer && review.reviewedAt && review.evidence && !review.notYetProved?.length;
  result.status = row.state === 'native-candidate' && approved(result.editorialReview) && approved(result.workflowReview) ? 'verified' : 'partial';
  if (row.state === 'localized-shell-candidate') result.reasons.push('native-owner-review-pending');
  if (result.status === 'partial') result.reasons.push('native-editor-or-full-workflow-review-pending');
  return finish();
}

function currentVerification(row, context, root = ROOT) {
  const app = context.apps.get(row.englishId);
  return evaluateCurrent(row, app, context.receipts.get(row.englishId), app ? snapshot(app, root) : null);
}

module.exports = { ROOT, CONFIG_PATH, RECEIPTS_PATH, STATUSES, loadVerification, servedInputs, collectInputs, snapshot, evaluateCurrent, currentVerification };
