#!/usr/bin/env node
/**
 * AFROTOOLS — Registry Validator
 * ===================================================================
 * Validates tool-registry.js entries against the filesystem.
 *
 * Checks:
 *   - Duplicate tool IDs
 *   - Missing required fields
 *   - Href files/directories exist
 *   - Live tools have descriptions (20+ chars)
 *   - Country assignments present
 *   - Category matches AFRO_CATEGORIES
 *
 * Usage:
 *   node scripts/validate-registry.js
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');

// Load registry
const registryPath = path.join(ROOT, 'assets', 'js', 'components', 'tool-registry.js');
const registryCode = fs.readFileSync(registryPath, 'utf8');

function FakeEvent() {}
const sandbox = {
  window: {},
  CustomEvent: FakeEvent,
  document: {
    readyState: 'complete',
    getElementById: () => null,
    createElement: () => ({ textContent: '' }),
    head: { appendChild: () => {} },
    addEventListener: () => {},
    dispatchEvent: () => {},
    querySelector: () => null,
  }
};

vm.runInNewContext(registryCode, sandbox);
const AFRO_TOOLS = sandbox.AFRO_TOOLS;
const AFRO_CATEGORIES = sandbox.AFRO_CATEGORIES;

if (!AFRO_TOOLS || !Array.isArray(AFRO_TOOLS)) {
  console.error('Failed to load AFRO_TOOLS from registry');
  process.exit(1);
}

console.log(`Loaded ${AFRO_TOOLS.length} tools from registry\n`);

let errors = 0;
let warnings = 0;

function error(msg) { console.log(`  ❌ ${msg}`); errors++; }
function warn(msg) { console.log(`  ⚠️  ${msg}`); warnings++; }
function pass(msg) { console.log(`  ✅ ${msg}`); }

// 1. Duplicate IDs
console.log('📋 Checking for duplicate IDs...');
const ids = {};
AFRO_TOOLS.forEach(t => {
  if (ids[t.id]) error(`Duplicate ID: "${t.id}"`);
  ids[t.id] = true;
});
if (errors === 0) pass('No duplicate IDs');

// 2. Required fields
console.log('\n📋 Checking required fields...');
let missingCount = 0;
AFRO_TOOLS.forEach(t => {
  const missing = [];
  if (!t.id) missing.push('id');
  if (!t.name) missing.push('name');
  if (!t.href) missing.push('href');
  if (!t.category) missing.push('category');
  if (!t.status) missing.push('status');
  if (!t.countries || t.countries.length === 0) missing.push('countries');
  if (missing.length > 0) {
    warn(`Tool "${t.id || t.name || '?'}" missing: ${missing.join(', ')}`);
    missingCount++;
  }
});
if (missingCount === 0) pass('All tools have required fields');

// 3. Live tools with hrefs — check if file/directory exists
console.log('\n📋 Checking live tool paths...');
let pathIssues = 0;
AFRO_TOOLS.filter(t => t.status === 'live' || t.status === 'new').forEach(t => {
  if (!t.href || t.href === '#') return;
  const cleanPath = t.href.replace(/\/$/, '');
  // Check for: path.html, path/index.html, or path (as file)
  const candidates = [
    path.join(ROOT, cleanPath + '.html'),
    path.join(ROOT, cleanPath, 'index.html'),
    path.join(ROOT, cleanPath),
  ];
  const exists = candidates.some(p => fs.existsSync(p));
  if (!exists) {
    warn(`Live tool "${t.id}" → ${t.href} — no matching file found`);
    pathIssues++;
  }
});
if (pathIssues === 0) pass('All live tool hrefs resolve to files');
else warn(`${pathIssues} live tools with unresolvable paths`);

// 4. Descriptions
console.log('\n📋 Checking descriptions...');
const shortDesc = AFRO_TOOLS.filter(t => (t.status === 'live' || t.status === 'new') && (!t.desc || t.desc.length < 20));
if (shortDesc.length > 0) warn(`${shortDesc.length} live tools with short/missing descriptions`);
else pass('All live tools have descriptions (20+ chars)');

// 5. Category validation
console.log('\n📋 Checking categories...');
const validCats = AFRO_CATEGORIES ? Object.keys(AFRO_CATEGORIES) : [];
let unknownCats = 0;
AFRO_TOOLS.forEach(t => {
  if (validCats.length > 0 && !validCats.includes(t.category)) {
    warn(`Tool "${t.id}" has unknown category: "${t.category}"`);
    unknownCats++;
  }
});
if (unknownCats === 0) pass('All tools use valid categories');

// Summary
console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${errors} errors, ${warnings} warnings`);
if (errors > 0) {
  console.log('❌ Registry has errors that must be fixed.');
  process.exit(1);
} else if (warnings > 0) {
  console.log('⚠️  Registry has warnings (non-blocking).');
} else {
  console.log('✅ Registry is clean.');
}
