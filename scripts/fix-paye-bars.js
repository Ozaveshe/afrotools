#!/usr/bin/env node
/**
 * Fix bar chart colors (multi-color) and grid colors in all PAYE files
 */
const fs = require('fs');
const path = require('path');

function findFiles(dir, results) {
  results = results || [];
  fs.readdirSync(dir, { withFileTypes: true }).forEach(e => {
    if (['node_modules', '.git', '.claude'].includes(e.name)) return;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findFiles(full, results);
    else if (e.name.endsWith('-paye.html') || e.name.endsWith('-vat.html')) {
      results.push(full);
    }
  });
  return results;
}

const files = findFiles('.');
let count = 0;

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  const orig = c;

  // 1. Fix single-color bar charts for tax bands - make multi-color
  // Pattern: label:'Tax...' with AfroChartColors.series[0]
  c = c.replace(
    /(label\s*:\s*['"]Tax[^'"]*['"][^}]*?)backgroundColor\s*:\s*AfroChartColors\.series\[0\]/g,
    '$1backgroundColor: AfroChartColors.series.slice(0, bands.length)'
  );

  // 2. Fix remaining grid color hardcodes
  c = c.replace(/grid:\s*\{\s*color:\s*['"]#faf3f3['"]\s*\}/g, 'grid: { color: AfroChartColors.grid }');
  c = c.replace(/grid:\s*\{\s*color:\s*['"]#EFF6FF['"]\s*\}/g, 'grid: { color: AfroChartColors.grid }');

  if (c !== orig) {
    fs.writeFileSync(f, c);
    count++;
    console.log(path.relative('.', f));
  }
});

console.log('Fixed ' + count + ' files');
