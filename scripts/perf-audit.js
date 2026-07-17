#!/usr/bin/env node
/**
 * AFROTOOLS — Performance Budget Audit
 * ===================================================================
 * Checks file sizes against performance budgets.
 *
 * Usage:
 *   node scripts/perf-audit.js
 *
 * Budgets:
 *   - No individual JS file > 50KB
 *   - No individual CSS file > 30KB
 *   - Tool registry < 80KB (it's large by design)
 *   - Total lib/ JS < 100KB
 * ===================================================================
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// Budget rules (bytes)
const BUDGETS = {
  jsFile:    50 * 1024,    // 50KB per JS file
  cssFile:   30 * 1024,    // 30KB per CSS file
  registry:  80 * 1024,    // 80KB for tool-registry.js
  libTotal: 100 * 1024,    // 100KB total for lib/ JS
};

let warnings = 0;
let passes = 0;

function formatKB(bytes) {
  return (bytes / 1024).toFixed(1) + 'KB';
}

function check(label, actual, budget) {
  const ok = actual <= budget;
  const icon = ok ? '✅' : '⚠️';
  const status = ok ? 'PASS' : 'OVER';
  console.log(`  ${icon} ${label}: ${formatKB(actual)} / ${formatKB(budget)} [${status}]`);
  if (ok) passes++;
  else warnings++;
}

// ── Audit JS files ──────────────────────────────────────

console.log('\n📦 JavaScript Files:');

function walkDir(dir, ext) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  const items = fs.readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    const full = path.join(dir, item.name);
    if (item.isDirectory()) {
      results.push(...walkDir(full, ext));
    } else if (item.name.endsWith(ext)) {
      results.push({ path: full, size: fs.statSync(full).size, name: item.name });
    }
  }
  return results;
}

const jsDir = path.join(ROOT, 'assets', 'js');
const jsFiles = walkDir(jsDir, '.js');

// Check individual files
for (const f of jsFiles) {
  const rel = path.relative(ROOT, f.path).replace(/\\/g, '/');
  const budget = rel.includes('tool-registry') ? BUDGETS.registry : BUDGETS.jsFile;
  if (f.size > budget * 0.8) { // Only show files near or over budget
    check(rel, f.size, budget);
  }
}

// Check lib/ total
const libFiles = jsFiles.filter(f => f.path.includes(path.join('js', 'lib')));
const libTotal = libFiles.reduce((sum, f) => sum + f.size, 0);
check('Total lib/ JS', libTotal, BUDGETS.libTotal);

// ── Audit CSS files ──────────────────────────────────────

console.log('\n🎨 CSS Files:');

const cssDir = path.join(ROOT, 'assets', 'css');
const cssFiles = walkDir(cssDir, '.css');

for (const f of cssFiles) {
  const rel = path.relative(ROOT, f.path).replace(/\\/g, '/');
  if (f.size > BUDGETS.cssFile * 0.8) {
    check(rel, f.size, BUDGETS.cssFile);
  }
}

// ── Summary ──────────────────────────────────────────────

console.log(`\n${'─'.repeat(50)}`);
console.log(`Results: ${passes} passed, ${warnings} warnings`);

if (warnings > 0) {
  console.log('⚠️  Some files exceed performance budgets. Consider splitting or minifying.');
  process.exit(1);
} else {
  console.log('✅ All files within performance budgets.');
}
