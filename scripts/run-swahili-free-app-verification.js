#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const { ROOT, RECEIPTS_PATH, loadVerification, snapshot } = require('./lib/swahili-free-app-verification');

function browserResults(report, contracts, exitCode, processError = false) {
  const specs = [];
  function visit(suite) {
    for (const spec of suite.specs || []) specs.push(spec);
    for (const child of suite.suites || []) visit(child);
  }
  for (const suite of report.suites || []) visit(suite);
  return contracts.map(contract => {
    const matches = specs.filter(spec => {
      const file = String(spec.file || '').replace(/\\/g, '/');
      const resolved = report.config?.rootDir ? path.posix.join(String(report.config.rootDir).replace(/\\/g, '/'), file) : file;
      return spec.title === contract.title && (file === contract.file || resolved.endsWith(`/${contract.file}`));
    });
    const test = matches.length === 1 && matches[0].tests?.length === 1 ? matches[0].tests[0] : null;
    let status = 'not-run';
    if (processError || report.errors?.length || matches.length > 1 || matches[0]?.tests?.length > 1) status = 'failed';
    else if (test?.status === 'skipped') status = 'skipped';
    else if (test?.results?.length === 1) {
      const final = test.results[0].status;
      status = final === 'passed' && test.status === 'expected' ? 'passed'
        : ['timedOut', 'interrupted'].includes(final) ? final : 'failed';
    } else if (test || exitCode !== 0) status = 'failed';
    return { id: contract.id, file: contract.file, title: contract.title, status };
  });
}

function execute(args, root, env) {
  return new Promise(resolve => {
    const child = childProcess.spawn(process.execPath, args, { cwd: root, env, windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', error = false;
    const timeout = setTimeout(() => { error = true; child.kill(); }, 10 * 60 * 1000);
    child.stdout.on('data', bytes => {
      stdout += bytes;
      if (stdout.length > 16 * 1024 * 1024) { error = true; child.kill(); }
    });
    // Never log raw assertion output or user-like fixtures to receipts/console.
    child.stderr.on('data', () => {});
    child.on('error', () => { error = true; });
    child.on('close', (status, signal) => { clearTimeout(timeout); resolve({ status, stdout, error: error || !!signal }); });
  });
}

async function runChecks(apps, options = {}) {
  const groups = new Map(), results = new Map();
  for (const app of apps) for (const check of app.verification.checks) {
    if (!groups.has(check.file)) groups.set(check.file, []);
    groups.get(check.file).push(check);
  }
  for (const [file, contracts] of groups) {
    const expression = contracts.map(check => `(?:^| )${check.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).join('|');
    const args = ['node_modules/@playwright/test/cli.js', 'test', file, '--grep', expression,
      '--workers=1', '--retries=0', '--trace=off', '--reporter=json'];
    let execution;
    try {
      execution = await (options.execute || execute)(args, options.root || ROOT,
        { ...process.env, AFROTOOLS_SW_CURRENT_VERIFICATION: '1', SW_DOCUMENT_PDF_IDS: apps.map(app => app.id).join(','),
          AFROTOOLS_TEST_DISABLE_ANALYTICS: '1', AFROTOOLS_TEST_PUBLISH_ARTIFACT: '0' });
    } catch { execution = { status: null, error: true, stdout: '' }; }
    let report;
    try { report = JSON.parse(execution.stdout); } catch { report = {}; execution.error = true; }
    for (const result of browserResults(report, contracts, execution.status, execution.error)) {
      results.set(result.id, result);
      if (!options.quiet) console.log(`${result.id}: ${result.status}`);
    }
  }
  return results;
}

function buildRunReceipts(apps, before, results, metadata, root = ROOT) {
  return apps.map(app => {
    const after = snapshot(app, root);
    const checks = app.verification.checks.map(check => results.get(check.id) || { id: check.id, file: check.file, title: check.title, status: 'not-run' });
    return { englishId: app.id, locale: 'sw', swahiliRoute: app.swahiliRoute,
      testedRevision: metadata.testedRevision, testedTree: metadata.testedTree, workspaceDirty: metadata.workspaceDirty,
      startedAt: metadata.startedAt, finishedAt: metadata.finishedAt || null,
      executionStatus: metadata.finishedAt ? 'completed' : 'running', fingerprint: before.get(app.id),
      sourceChangedDuringRun: before.get(app.id).value !== after.value,
      runFailed: checks.some(check => ['failed', 'timedOut', 'interrupted'].includes(check.status)), checks,
      environment: { localStaticServer: true, analytics: 'disabled-test-adapter',
        consentFixture: { key: 'afrotools_cookie_consent', value: 'declined' },
        serviceWorkers: 'blocked', syntheticFixtures: true, artifacts: 'trace-video-screenshot-off',
        printProof: 'prepared-window-and-content-only; native OS printing not proved',
        liveProviderOrProductionProof: false }, production: null };
  });
}

function mergeReceipts(previous, selectedIds, rows) {
  return [...previous.values()].filter(row => !selectedIds.includes(row.englishId)).concat(rows)
    .sort((a, b) => a.englishId.localeCompare(b.englishId));
}

async function main() {
  const context = loadVerification();
  const selected = process.argv.find(arg => arg.startsWith('--app='));
  const ids = selected ? selected.slice(6).split(',') : [...context.apps.keys()];
  if (new Set(ids).size !== ids.length || !ids.length) throw Error('Select unique nonempty owner IDs.');
  const apps = ids.map(id => {
    if (!context.apps.has(id)) throw Error(`No Swahili current-verification contract for ${id}.`);
    return context.apps.get(id);
  });
  const before = new Map(apps.map(app => [app.id, snapshot(app)]));
  const git = args => childProcess.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  const metadata = { testedRevision: git(['rev-parse', 'HEAD']), testedTree: git(['rev-parse', 'HEAD^{tree}']),
    workspaceDirty: !!git(['status', '--porcelain']), startedAt: new Date().toISOString() };
  function save(rows) {
    const combined = mergeReceipts(context.receipts, ids, rows);
    const output = { schemaVersion: 1, locale: 'sw', proofBoundary: 'Current local synthetic execution only. Historical acceptance, native/full workflow review and production proof remain separate.', rows: combined };
    const file = path.join(ROOT, RECEIPTS_PATH), temporary = `${file}.tmp`;
    fs.writeFileSync(temporary, `${JSON.stringify(output, null, 2)}\n`); fs.renameSync(temporary, file);
  }
  // Invalidate a previous pass before starting: termination leaves a running,
  // nonaccepted receipt, including when a required dependency is now missing.
  save(buildRunReceipts(apps, before, new Map(), metadata));
  if (apps.some(app => !before.get(app.id).value)) throw Error('Current verification inputs are missing; selected previous passes were invalidated.');
  const results = await runChecks(apps);
  metadata.finishedAt = new Date().toISOString();
  const rows = buildRunReceipts(apps, before, results, metadata); save(rows);
  if (rows.some(row => row.runFailed || row.sourceChangedDuringRun || row.checks.some(check => check.status !== 'passed'))) process.exitCode = 1;
}

if (require.main === module) main().catch(() => { console.error('Swahili verification did not complete; selected execution receipts remain fail-closed.'); process.exitCode = 1; });
module.exports = { browserResults, runChecks, buildRunReceipts, mergeReceipts };
