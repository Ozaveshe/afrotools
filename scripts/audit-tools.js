#!/usr/bin/env node
/**
 * AfroTools Tool Audit
 * Checks which tools in the registry actually have pages on disk.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const code = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');

// Execute registry in this context
const window = {};
eval(code);

const totalToolInstances = typeof getTotalToolCount === 'function' ? getTotalToolCount() : AFRO_TOOLS.length;
const liveToolInstances = typeof getTotalToolCount === 'function'
  ? getTotalToolCount(t => t.status === 'live' || t.status === 'new')
  : AFRO_TOOLS.filter(t => t.status === 'live' || t.status === 'new').length;

// Count by status
const counts = {};
AFRO_TOOLS.forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
console.log('=== STATUS COUNTS ===');
Object.entries(counts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));
console.log(`  TOTAL: ${AFRO_TOOLS.length}`);

// Count by category
const catCounts = {};
AFRO_TOOLS.forEach(t => { catCounts[t.category] = (catCounts[t.category] || 0) + 1; });
console.log('\n=== BY CATEGORY ===');
Object.entries(catCounts).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`  ${k}: ${v}`));

// Check which live tools have actual pages
let missing = 0, found = 0;
const missingList = [];
const foundList = [];

AFRO_TOOLS.filter(t => t.status === 'live' || t.status === 'new').forEach(t => {
  let href = t.href.replace(/\/$/, '');
  if (!href.startsWith('/')) href = '/' + href;

  const tries = [
    path.join(ROOT, href, 'index.html'),
    path.join(ROOT, href + '.html'),
  ];

  const exists = tries.some(p => fs.existsSync(p));
  if (exists) {
    found++;
    foundList.push(t.id);
  } else {
    missing++;
    missingList.push(`${t.id} -> ${t.href}`);
  }
});

console.log(`\n=== LIVE/NEW TOOLS WITH PAGES ===`);
console.log(`  Found: ${found}`);
console.log(`  Missing page: ${missing}`);

if (missingList.length > 0) {
  console.log(`\n=== MISSING PAGES ===`);
  missingList.forEach(m => console.log(`  ${m}`));
}

// Check which tools have working app.html (functional tools)
const withApp = [];
AFRO_TOOLS.filter(t => t.status === 'live' || t.status === 'new').forEach(t => {
  let href = t.href.replace(/\/$/, '');
  if (!href.startsWith('/')) href = '/' + href;
  const appPath = path.join(ROOT, href, 'app.html');
  if (fs.existsSync(appPath)) {
    withApp.push(t.id);
  }
});

console.log(`\n=== TOOLS WITH app.html (full functional apps) ===`);
console.log(`  Count: ${withApp.length}`);
withApp.forEach(id => console.log(`  ${id}`));

// Summary recommendation
console.log(`\n=== RECOMMENDATION ===`);
console.log(`  Registry rows: ${AFRO_TOOLS.length}`);
console.log(`  Expanded tool instances: ${totalToolInstances}`);
console.log(`  ${found} live/new registry rows have landing pages`);
console.log(`  ${withApp.length} have full working apps (app.html)`);
console.log(`  Homepage should claim: "${liveToolInstances.toLocaleString('en-US')}+" live tools`);
