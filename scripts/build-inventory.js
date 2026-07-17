#!/usr/bin/env node
/**
 * Phase 1: Build Inventory
 * Scans registry for all non-live tools and categorizes them by complexity.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

eval(fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8'));

// Get all non-live tools
const pending = AFRO_TOOLS.filter(t => t.status !== 'live' && t.status !== 'new');
const live = AFRO_TOOLS.filter(t => t.status === 'live' || t.status === 'new');

console.log(`=== REGISTRY SUMMARY ===`);
console.log(`  Total tools: ${AFRO_TOOLS.length}`);
console.log(`  Live: ${live.length}`);
console.log(`  Pending: ${pending.length}`);

// Group pending by category
const byCat = {};
pending.forEach(t => {
  if (!byCat[t.category]) byCat[t.category] = [];
  byCat[t.category].push(t);
});

console.log(`\n=== PENDING BY CATEGORY ===`);
Object.entries(byCat).sort((a,b) => b[1].length - a[1].length).forEach(([cat, tools]) => {
  console.log(`\n  --- ${cat} (${tools.length} tools) ---`);
  tools.forEach(t => {
    // Check if page exists
    let href = t.href.replace(/\/$/, '');
    if (!href.startsWith('/')) href = '/' + href;
    const tries = [
      path.join(ROOT, href, 'index.html'),
      path.join(ROOT, href + '.html'),
    ];
    const hasPage = tries.some(p => fs.existsSync(p));
    const pageStatus = hasPage ? 'HAS PAGE' : 'NO PAGE';
    console.log(`    [${t.status}] ${t.id}: ${t.name} (${pageStatus}) -> ${t.href}`);
  });
});

// Group by status
const byStatus = {};
pending.forEach(t => {
  if (!byStatus[t.status]) byStatus[t.status] = 0;
  byStatus[t.status]++;
});
console.log(`\n=== PENDING BY STATUS ===`);
Object.entries(byStatus).forEach(([s,c]) => console.log(`  ${s}: ${c}`));

// Count how many pending have pages vs not
const withPage = pending.filter(t => {
  let href = t.href.replace(/\/$/, '');
  if (!href.startsWith('/')) href = '/' + href;
  return [path.join(ROOT, href, 'index.html'), path.join(ROOT, href + '.html')].some(p => fs.existsSync(p));
});
console.log(`\n=== PAGE STATUS ===`);
console.log(`  Pending with existing pages: ${withPage.length}`);
console.log(`  Pending with NO pages: ${pending.length - withPage.length}`);

// List pending with NO pages (these need to be built from scratch)
const noPage = pending.filter(t => {
  let href = t.href.replace(/\/$/, '');
  if (!href.startsWith('/')) href = '/' + href;
  return ![path.join(ROOT, href, 'index.html'), path.join(ROOT, href + '.html')].some(p => fs.existsSync(p));
});
console.log(`\n=== TOOLS WITH NO PAGES (need building or removal) ===`);
noPage.forEach(t => console.log(`  [${t.category}] ${t.id}: ${t.name} -> ${t.href}`));
