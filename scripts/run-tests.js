#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const ROOT = path.resolve(__dirname, '..');
const TESTS_DIR = path.join(ROOT, 'tests');
const QUARANTINE_DIR = path.join(TESTS_DIR, 'quarantine');
const CONCURRENCY = 4;
const FILE_TIMEOUT_MS = 120000;

const AUDITS = Object.freeze([
  { name: 'check-links', file: 'scripts/check-links.js' },
  { name: 'audit-tools', file: 'scripts/audit-tools.js' },
  { name: 'audit-scholarship-truth', file: 'scripts/audit-scholarship-truth.js' },
  { name: 'audit-public-claims', file: 'scripts/audit-public-claims.js' },
  { name: 'audit-automation-registry', file: 'scripts/audit-automation-registry.js' },
  { name: 'verify-blog-backend', file: 'scripts/verify-blog-backend.js' },
  { name: 'verify-cv-template-registry', file: 'scripts/verify-cv-template-registry.js' },
]);

function topLevelTests() {
  return fs.readdirSync(TESTS_DIR, { withFileTypes: true })
    .filter(function (entry) { return entry.isFile() && entry.name.endsWith('.test.js'); })
    .map(function (entry) { return path.join('tests', entry.name); })
    .sort();
}

function quarantinedTests() {
  if (!fs.existsSync(QUARANTINE_DIR)) return [];
  return fs.readdirSync(QUARANTINE_DIR, { withFileTypes: true })
    .filter(function (entry) { return entry.isFile() && entry.name.endsWith('.test.js'); })
    .map(function (entry) { return path.join('tests', 'quarantine', entry.name); })
    .sort();
}

function run(command, args) {
  return new Promise(function (resolve) {
    const child = spawn(command, args, {
      cwd: ROOT,
      env: process.env,
      stdio: 'inherit',
      shell: false,
    });
    child.on('error', function (error) {
      console.error(error.message);
      resolve(1);
    });
    child.on('exit', function (code, signal) {
      if (signal) console.error('Process terminated by ' + signal);
      resolve(typeof code === 'number' ? code : 1);
    });
  });
}

// Leave room for the executable and flags below Windows' 32,767-character limit.
// Doubling each path also bounds Windows quoting/backslash expansion.
function testBatches(files, limit = 24000) {
  const batches = [];
  let batch = [];
  let length = 0;
  for (const file of files) {
    const cost = file.length * 2 + 3;
    if (cost > limit) throw new Error('Test path exceeds command budget: ' + file);
    if (length + cost > limit) {
      batches.push(batch);
      batch = [];
      length = 0;
    }
    batch.push(file);
    length += cost;
  }
  if (batch.length) batches.push(batch);
  return batches;
}

async function runTestBatches(files, runner = run) {
  let exitCode = 0;
  const batches = testBatches(files);
  for (let index = 0; index < batches.length; index += 1) {
    console.log('\n=== Test batch ' + (index + 1) + '/' + batches.length + ' ===');
    const result = await runner(process.execPath, [
      '--test',
      '--test-concurrency=' + CONCURRENCY,
      '--test-timeout=' + FILE_TIMEOUT_MS,
    ].concat(batches[index]));
    if (result !== 0) exitCode = 1;
  }
  return exitCode;
}

async function main() {
  const tests = topLevelTests();
  const quarantined = quarantinedTests();
  const quarantineDoc = path.join(QUARANTINE_DIR, 'QUARANTINE.md');

  if (!tests.length) {
    console.error('No tests/*.test.js files were discovered.');
    process.exitCode = 1;
    return;
  }
  if (quarantined.length && !fs.existsSync(quarantineDoc)) {
    console.error('Quarantined tests require tests/quarantine/QUARANTINE.md.');
    process.exitCode = 1;
    return;
  }

  console.log('\n=== Test enrollment ===');
  console.log('Discovered: ' + tests.length + ' top-level test files');
  console.log('Concurrency: ' + CONCURRENCY);
  console.log('Per-file timeout: ' + FILE_TIMEOUT_MS + 'ms');
  console.log('Quarantined: ' + quarantined.length);

  const testExit = await runTestBatches(tests);

  const auditResults = [];
  for (const audit of AUDITS) {
    console.log('\n=== Audit: ' + audit.name + ' ===');
    const exitCode = await run(process.execPath, [audit.file]);
    auditResults.push({ name: audit.name, exitCode: exitCode });
  }

  const failedAudits = auditResults.filter(function (result) { return result.exitCode !== 0; });
  console.log('\n=== Test summary ===');
  console.log('Tests: ' + (testExit === 0 ? 'PASS' : 'FAIL') + ' (' + tests.length + ' files)');
  console.log('Audits: ' + (failedAudits.length ? 'FAIL' : 'PASS') +
    ' (' + (auditResults.length - failedAudits.length) + '/' + auditResults.length + ')');
  console.log('Quarantined: ' + quarantined.length);
  if (quarantined.length) quarantined.forEach(function (file) { console.log('  - ' + file); });
  if (failedAudits.length) {
    console.log('Failed audits: ' + failedAudits.map(function (result) { return result.name; }).join(', '));
  }

  process.exitCode = testExit === 0 && failedAudits.length === 0 ? 0 : 1;
}

if (require.main === module) {
  main().catch(function (error) {
    console.error(error);
    process.exitCode = 1;
  });
}

module.exports = { testBatches, runTestBatches };
