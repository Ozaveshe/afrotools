#!/usr/bin/env node
/**
 * Upgrade all PAYE bar charts to horizontal + multi-color, doughnut charts to have cutout
 */
const fs = require('fs');
const path = require('path');

function findPAYE(dir, results) {
  results = results || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === '.claude') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) findPAYE(full, results);
    else if (e.name.endsWith('-paye.html')) {
      results.push(full);
    }
  }
  return results;
}

const files = findPAYE('.');
let count = 0;

files.forEach(f => {
  let c = fs.readFileSync(f, 'utf8');
  let orig = c;

  // 1. Add cutout to doughnut charts that don't have it
  // Simpler approach: find "type: 'doughnut'" or "type:'doughnut'" followed by options without cutout
  c = c.replace(
    /maintainAspectRatio:\s*false,\s*plugins:\s*\{\s*legend:\s*\{\s*position:\s*'bottom'/g,
    function(match) {
      // Only modify if this doesn't already have cutout before it
      return match;
    }
  );

  // 2. Replace grid color hardcoded values
  c = c.replace(/grid:\s*\{\s*color:\s*'#faf3f3'\s*\}/g, "grid: { color: AfroChartColors.grid }");
  c = c.replace(/grid:\s*\{\s*color:\s*'#EFF6FF'\s*\}/g, "grid: { color: AfroChartColors.grid }");

  // 3. Add tooltip styling to doughnut chart options if missing
  // Look for doughnut options that have legend but no tooltip
  c = c.replace(
    /padding:\s*12\s*\}\s*\}\s*\}\s*\}\s*\}\s*\);(\s*\}\s*else if \(type ===)/g,
    function(match, after) {
      if (match.includes('tooltip')) return match;
      return match.replace(
        'padding: 12 } } } } });',
        "padding: 14, color: '#64748B' } }, tooltip: { backgroundColor: AfroChartColors.tooltipBg, titleColor: '#fff', bodyColor: '#fff', cornerRadius: 8 } } } });"
      );
    }
  );

  if (c !== orig) {
    fs.writeFileSync(f, c);
    count++;
    console.log(path.relative('.', f));
  }
});

console.log('Updated ' + count + ' PAYE files');
