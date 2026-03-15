#!/usr/bin/env node
/**
 * AfroTools PAYE Engine Test Runner
 * ==================================
 * Zero-dependency test runner for IIFE-based engine files.
 * Provides a mock `window` object, evaluates each engine, then runs test suites.
 *
 * Usage:  node tests/run.js
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const vm   = require('vm');

// ── COLOURS ──────────────────────────────────────────────

const C = {
  reset:  '\x1b[0m',
  red:    '\x1b[31m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  cyan:   '\x1b[36m',
  dim:    '\x1b[2m',
  bold:   '\x1b[1m',
};

// ── ENGINE LOADER ────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const ENGINE_DIR = path.join(ROOT, 'assets', 'js', 'engines');

/**
 * Load an engine file by evaluating it with a mock `window` object.
 * Returns the populated AfroTools.engines.* namespace.
 */
function loadEngine(filename) {
  const filePath = path.join(ENGINE_DIR, filename);
  const code = fs.readFileSync(filePath, 'utf-8');

  const mockWindow = {
    AfroTools: { engines: {} },
  };

  // Create a sandbox with `window` and also `Infinity` / `Math`
  const sandbox = {
    window: mockWindow,
    Infinity,
    Math,
    isNaN,
    isFinite,
    parseInt,
    parseFloat,
    console,
  };

  vm.runInNewContext(code, sandbox, { filename });
  return mockWindow.AfroTools.engines;
}

// ── TEST HELPERS ─────────────────────────────────────────

let totalTests   = 0;
let totalPassed  = 0;
let totalFailed  = 0;
let currentGroup = '';
const failures   = [];

function assert(condition, message) {
  totalTests++;
  if (condition) {
    totalPassed++;
    console.log(`    ${C.green}\u2713${C.reset} ${message}`);
  } else {
    totalFailed++;
    const msg = `    ${C.red}\u2717${C.reset} ${message}`;
    console.log(msg);
    failures.push({ group: currentGroup, message });
  }
}

function assertEqual(actual, expected, message) {
  totalTests++;
  if (actual === expected) {
    totalPassed++;
    console.log(`    ${C.green}\u2713${C.reset} ${message}`);
  } else {
    totalFailed++;
    const msg = `${message} — expected ${expected}, got ${actual}`;
    console.log(`    ${C.red}\u2717${C.reset} ${msg}`);
    failures.push({ group: currentGroup, message: msg });
  }
}

function assertClose(actual, expected, tolerance, message) {
  totalTests++;
  const diff = Math.abs(actual - expected);
  if (diff <= tolerance) {
    totalPassed++;
    console.log(`    ${C.green}\u2713${C.reset} ${message}`);
  } else {
    totalFailed++;
    const msg = `${message} — expected ~${expected}, got ${actual} (diff ${diff.toFixed(2)}, tol ${tolerance})`;
    console.log(`    ${C.red}\u2717${C.reset} ${msg}`);
    failures.push({ group: currentGroup, message: msg });
  }
}

// ── ENGINE ↔ TEST FILE MAP ──────────────────────────────

const TEST_SUITES = [
  { engineFile: 'ng-paye.js', engineKey: 'ngPAYE', testFile: 'ng-paye.test.js', label: 'Nigeria PAYE' },
  { engineFile: 'ke-paye.js', engineKey: 'kePAYE', testFile: 'ke-paye.test.js', label: 'Kenya PAYE' },
  { engineFile: 'gh-paye.js', engineKey: 'ghPAYE', testFile: 'gh-paye.test.js', label: 'Ghana PAYE' },
  { engineFile: 'za-paye.js', engineKey: 'zaPAYE', testFile: 'za-paye.test.js', label: 'South Africa PAYE' },
  { engineFile: 'eg-paye.js', engineKey: 'egPAYE', testFile: 'eg-paye.test.js', label: 'Egypt PAYE' },
  { engineFile: 'tz-paye.js', engineKey: 'tzPAYE', testFile: 'tz-paye.test.js', label: 'Tanzania PAYE' },
];

// ── RUN ─────────────────────────────────────────────────

console.log();
console.log(`${C.bold}${C.cyan}=== AfroTools PAYE Engine Tests ===${C.reset}`);
console.log();

for (const suite of TEST_SUITES) {
  const testPath = path.join(__dirname, 'engines', suite.testFile);
  if (!fs.existsSync(testPath)) {
    console.log(`${C.yellow}  SKIP${C.reset} ${suite.label} — test file not found`);
    continue;
  }

  // Load engine
  let engines;
  try {
    engines = loadEngine(suite.engineFile);
  } catch (err) {
    console.log(`${C.red}  ERROR${C.reset} loading engine ${suite.engineFile}: ${err.message}`);
    continue;
  }

  const engine = engines[suite.engineKey];
  if (!engine) {
    console.log(`${C.red}  ERROR${C.reset} engine key "${suite.engineKey}" not found after loading ${suite.engineFile}`);
    continue;
  }

  // Load and run test module
  currentGroup = suite.label;
  console.log(`${C.bold}  ${suite.label}${C.reset} ${C.dim}(${suite.engineFile})${C.reset}`);

  try {
    const testFn = require(testPath);
    testFn(engine, assert, assertEqual, assertClose);
  } catch (err) {
    console.log(`${C.red}    ERROR running tests: ${err.message}${C.reset}`);
    console.log(`${C.dim}    ${err.stack}${C.reset}`);
  }

  console.log();
}

// ── SUMMARY ─────────────────────────────────────────────

console.log(`${C.bold}${C.cyan}=== Summary ===${C.reset}`);
console.log(`  Total:  ${totalTests}`);
console.log(`  ${C.green}Passed: ${totalPassed}${C.reset}`);

if (totalFailed > 0) {
  console.log(`  ${C.red}Failed: ${totalFailed}${C.reset}`);
  console.log();
  console.log(`${C.red}${C.bold}  Failed tests:${C.reset}`);
  for (const f of failures) {
    console.log(`    ${C.red}-${C.reset} [${f.group}] ${f.message}`);
  }
  console.log();
  process.exit(1);
} else {
  console.log(`  ${C.green}Failed: 0${C.reset}`);
  console.log();
  console.log(`${C.green}${C.bold}  All tests passed!${C.reset}`);
  console.log();
  process.exit(0);
}
