#!/usr/bin/env node
/**
 * Bulk-replace hardcoded chart colors across ALL files with AfroChartColors references.
 * Also injects chart-config.js loading into every file that uses Chart.js.
 */
const fs = require('fs');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

// Find all HTML files containing "new Chart("
function findChartFiles(dir, results) {
  results = results || [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name === '.git' || e.name === '.claude') continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      findChartFiles(full, results);
    } else if (e.name.endsWith('.html') || e.name.endsWith('.js')) {
      const content = fs.readFileSync(full, 'utf8');
      if (content.includes('new Chart(') || content.includes('new Chart (')) {
        results.push(full);
      }
    }
  }
  return results;
}

const files = findChartFiles(ROOT);
console.log(`Found ${files.length} files with Chart.js usage`);

let totalChanges = 0;

files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;
  let changes = 0;

  // 1. Replace doughnut backgroundColor arrays with AfroChartColors.doughnut
  // Pattern: backgroundColor: ['#hex','#hex',...] in doughnut contexts
  // We look for backgroundColor arrays that are 2-8 hex colors
  content = content.replace(
    /backgroundColor\s*:\s*\[\s*(['"]#[A-Fa-f0-9]{3,8}['"]\s*,\s*){1,7}['"]#[A-Fa-f0-9]{3,8}['"]\s*\]/g,
    function(match) {
      // Count how many colors
      const colorCount = (match.match(/#/g) || []).length;
      changes++;
      return `backgroundColor: AfroChartColors.doughnut.slice(0, ${colorCount})`;
    }
  );

  // 2. Replace single bar backgroundColor strings (hex colors) with AfroChartColors.series[0]
  // Pattern: backgroundColor: '#hex' or backgroundColor:'#hex' (for bar charts)
  content = content.replace(
    /backgroundColor\s*:\s*['"]#[A-Fa-f0-9]{3,8}['"]/g,
    function(match) {
      changes++;
      return `backgroundColor: AfroChartColors.series[0]`;
    }
  );

  // 3. Replace CHART_COLORS array definition with AfroChartColors reference
  content = content.replace(
    /const CHART_COLORS\s*=\s*\[.*?\];/g,
    function(match) {
      changes++;
      return `const CHART_COLORS = AfroChartColors.doughnut;`;
    }
  );

  // 4. Also fix any var(--color-primary) references in chart code
  content = content.replace(
    /backgroundColor\s*:\s*['"]var\(--color-primary\)['"]/g,
    function() {
      changes++;
      return `backgroundColor: AfroChartColors.series[0]`;
    }
  );

  // 5. Fix backgroundColor arrays with var() references
  content = content.replace(
    /backgroundColor\s*:\s*\[\s*['"]var\(--color-primary\)['"].*?\]/g,
    function(match) {
      const itemCount = (match.match(/['"][^'"]+['"]/g) || []).length;
      changes++;
      return `backgroundColor: AfroChartColors.series.slice(0, ${itemCount})`;
    }
  );

  // 6. Fix borderColor '#fff' in doughnut charts - keep it white
  // (already fine, no change needed)

  // 7. Fix tooltip backgroundColor in chart options
  content = content.replace(
    /tooltip\s*:\s*\{[^}]*backgroundColor\s*:\s*AfroChartColors\.series\[0\]/g,
    function(match) {
      changes++;
      return match.replace('AfroChartColors.series[0]', 'AfroChartColors.tooltipBg');
    }
  );

  // 8. Fix grid color references
  content = content.replace(
    /grid\s*:\s*\{\s*color\s*:\s*['"]#EFF6FF['"]/g,
    function() {
      changes++;
      return `grid: { color: AfroChartColors.grid`;
    }
  );

  // 9. Inject chart-config.js loading into lazy Chart.js loader
  // Pattern: onload after Chart.js CDN load, add config loading
  if (content.includes('chart.umd.min.js') && !content.includes('chart-config.js')) {
    // Replace the onload handler to also load chart-config
    content = content.replace(
      /(script\.onload|s\.onload)\s*=\s*\(\)\s*=>\s*\{\s*_chartLoaded\s*=\s*true;\s*renderChart\(([^)]*)\);\s*\}/g,
      function(match, varName, args) {
        changes++;
        return `${varName} = () => {
      _chartLoaded = true;
      if (!window.AfroChartColors) {
        var cfg = document.createElement('script');
        cfg.src = '/assets/js/lib/chart-config.js';
        cfg.onload = () => renderChart(${args});
        document.head.appendChild(cfg);
      } else { renderChart(${args}); }
    }`;
      }
    );
  }

  // Also handle Ghana-style async chart loading
  if (content.includes('chart.umd.min.js') && !content.includes('chart-config.js')) {
    content = content.replace(
      /src\s*=\s*['"]https:\/\/cdn\.jsdelivr\.net\/npm\/chart\.js[^'"]*['"]/g,
      function(match) {
        // Already handled above in most cases
        return match;
      }
    );
  }

  // 10. For files loading chart.js via cdnjs, same treatment
  if (content.includes('cdnjs.cloudflare.com') && content.includes('chart') && !content.includes('chart-config.js')) {
    content = content.replace(
      /(script\.src\s*=\s*'https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/Chart\.js\/[^']*';)/g,
      function(match) {
        return match; // Keep URL, config loading handled by onload above
      }
    );
  }

  // 11. Add chart-config.js as a direct script tag in HTML files that have Chart.js CDN in head
  if (filePath.endsWith('.html') && content.includes('chart.js') && !content.includes('chart-config.js')) {
    // Add before </head> if Chart.js is referenced
    if (content.includes('<script') && content.includes('Chart')) {
      content = content.replace(
        /(<\/head>)/,
        `<script src="/assets/js/lib/chart-config.js" defer></script>\n$1`
      );
      changes++;
    }
  }

  if (changes > 0) {
    fs.writeFileSync(filePath, content);
    const rel = path.relative(ROOT, filePath);
    console.log(`  ${rel}: ${changes} changes`);
    totalChanges += changes;
  }
});

console.log(`\nTotal: ${totalChanges} changes across ${files.length} files`);
