#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const childProcess = require('node:child_process');
const { ROOT, RECEIPTS_PATH, loadVerification, snapshot } = require('./lib/french-free-app-verification');

function browserResults(report, contracts, exitCode, processError = false) {
  const tests = [];
  function visit(suite) {
    for (const spec of suite.specs || []) tests.push(spec);
    for (const child of suite.suites || []) visit(child);
  }
  for (const suite of report.suites || []) visit(suite);
  return contracts.map((contract) => {
    const matches = tests.filter((spec) => {
      const file = String(spec.file || '').replace(/\\/g, '/');
      const resolved = report.config?.rootDir ? path.posix.join(String(report.config.rootDir).replace(/\\/g, '/'), file) : file;
      return spec.title === contract.title && (file === contract.file || resolved.endsWith(`/${contract.file}`));
    });
    const fatal = processError || (report.errors || []).length > 0;
    const passed = !fatal && matches.length === 1 && matches[0].tests?.length === 1
      && matches[0].tests[0].status === 'expected'
      && matches[0].tests[0].results?.length === 1
      && matches[0].tests[0].results[0].status === 'passed';
    const skipped = matches.length === 1 && matches[0].tests?.[0]?.status === 'skipped';
    return { id: contract.id, file: contract.file, title: contract.title,
      status: fatal ? 'failed' : passed ? 'passed' : skipped ? 'skipped' : matches.length || exitCode !== 0 ? 'failed' : 'not-run' };
  });
}

function runChecks(apps, options = {}) {
  const root = options.root || ROOT;
  const execute = options.execute || childProcess.spawnSync;
  const groups = new Map();
  for (const app of apps) for (const check of app.verification.checks) {
    const key = `${check.kind}:${check.file}`;
    if (!groups.has(key)) groups.set(key, []);
    if (!groups.get(key).some((entry) => entry.id === check.id)) groups.get(key).push(check);
  }
  const results = new Map();
  for (const contracts of groups.values()) {
    const first = contracts[0];
    let args;
    if (first.kind === 'node') args = ['--test', '--test-reporter=tap', first.file, ...(first.additionalFiles || [])];
    else if (first.kind === 'browser') {
      const expression = contracts.map((check) => `${check.title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`).join('|');
      args = ['node_modules/@playwright/test/cli.js', 'test', first.file, '--grep', expression,
        '--workers=1', '--retries=0', '--trace=off', '--reporter=json'];
    } else throw new Error(`Unsupported verification check kind: ${first.kind}`);
    let result;
    try { result = execute(process.execPath, args, {
      cwd: root,
      env: { ...process.env, AFROTOOLS_FR_CURRENT_VERIFICATION: '1', AFROTOOLS_TEST_DISABLE_ANALYTICS: '1' },
      encoding: 'utf8', maxBuffer: 16 * 1024 * 1024,
      timeout: 10 * 60 * 1000, windowsHide: true
    }); } catch { result = { status: null, stdout: '', error: true }; }
    let statuses;
    if (first.kind === 'browser') {
      let report = {};
      try { report = JSON.parse(result.stdout || '{}'); } catch { /* Invalid output stays fail-closed. */ }
      statuses = browserResults(report, contracts, result.status, Boolean(result.error || result.signal));
    } else {
      const passed = result.status === 0 && !result.error && /^# tests [1-9]\d*$/m.test(result.stdout || '')
        && /^# fail 0$/m.test(result.stdout || '');
      statuses = contracts.map((check) => ({ id: check.id, file: check.file, title: check.title, status: passed ? 'passed' : 'failed' }));
    }
    for (const status of statuses) {
      results.set(status.id, status);
      if (!options.quiet) console.log(`${status.id}: ${status.status}`);
    }
  }
  return results;
}

function buildRunReceipts(apps, before, results, metadata, root = ROOT) {
  return apps.map((app) => {
    const after = snapshot(app, root);
    const checks = app.verification.checks.map((check) => results.get(check.id)
      || { id: check.id, file: check.file, title: check.title, status: 'not-run' });
    return {
      englishId: app.id, locale: 'fr', frenchRoute: app.frenchRoute,
      testedRevision: metadata.testedRevision, workspaceDirty: metadata.workspaceDirty,
      startedAt: metadata.startedAt, finishedAt: metadata.finishedAt,
      executionStatus: metadata.finishedAt ? 'completed' : 'running',
      fingerprint: before.get(app.id),
      sourceChangedDuringRun: before.get(app.id).value !== after.value,
      runFailed: checks.some((check) => check.status === 'failed'),
      environment: { localStaticServer: true, analytics: 'disabled-test-adapter', serviceWorkers: 'blocked', syntheticFixtures: true },
      checks,
      production: null
    };
  });
}

function main() {
  const context = loadVerification();
  const selected = process.argv.find((arg) => arg.startsWith('--app='));
  const ids = selected ? selected.slice(6).split(',') : [...context.apps.keys()];
  const apps = ids.map((id) => {
    if (!context.apps.has(id)) throw new Error(`No current-verification contract for ${id}.`);
    return context.apps.get(id);
  });
  const before = new Map(apps.map((app) => [app.id, snapshot(app)]));
  if (apps.some((app) => !before.get(app.id).value)) throw new Error('Verification inputs are missing; no execution receipt written.');
  const git = (args) => childProcess.execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
  const metadata = { testedRevision: git(['rev-parse', 'HEAD']), workspaceDirty: !!git(['status', '--porcelain']), startedAt: new Date().toISOString() };
  const file = path.join(ROOT, RECEIPTS_PATH);
  function save(rows) {
    const combined = [...context.receipts.values()].filter((row) => !ids.includes(row.englishId)).concat(rows)
      .sort((a, b) => a.englishId.localeCompare(b.englishId));
    fs.writeFileSync(file, `${JSON.stringify({ schemaVersion: 1, locale: 'fr', proofBoundary: 'Local synthetic execution; historical, full editorial and production acceptance remain separate.', rows: combined }, null, 2)}\n`);
  }
  // Replace old passing evidence before execution so an interrupted run cannot
  // silently retain a previous pass for this scope.
  save(buildRunReceipts(apps, before, new Map(), metadata));
  const results = runChecks(apps);
  metadata.finishedAt = new Date().toISOString();
  const rows = buildRunReceipts(apps, before, results, metadata);
  save(rows);
  if (rows.some((row) => row.runFailed || row.sourceChangedDuringRun || row.checks.some((check) => check.status !== 'passed'))) process.exitCode = 1;
}

if (require.main === module) main();
module.exports = { browserResults, buildRunReceipts, runChecks };
