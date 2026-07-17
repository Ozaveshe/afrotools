#!/usr/bin/env node
/**
 * AFROTOOLS — Meta Tags Audit Script
 * Scans all HTML files and reports missing/incomplete SEO meta tags.
 *
 * Usage:  node scripts/audit-meta-tags.js
 * Output: Console report (does NOT modify any files)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SKIP_DIRS = ['node_modules', '.git', '.claude', 'scripts', 'supabase'];

function findHtmlFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.includes(entry.name)) results.push(...findHtmlFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function extract(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

function audit(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const issues = [];

  // <title>
  const title = extract(html, /<title>([^<]*)<\/title>/i);
  if (!title) {
    issues.push('MISSING <title>');
  } else {
    if (title.length < 30) issues.push(`title too short (${title.length} chars)`);
    if (title.length > 70) issues.push(`title too long (${title.length} chars)`);
    if (!/afrotools/i.test(title)) issues.push('title missing "AfroTools"');
  }

  // <meta name="description">
  const desc = extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);
  if (!desc) {
    issues.push('MISSING meta description');
  } else {
    if (desc.length < 80) issues.push(`description too short (${desc.length} chars)`);
    if (desc.length > 170) issues.push(`description too long (${desc.length} chars)`);
  }

  // OG tags
  if (!/<meta\s+property=["']og:title["']/i.test(html)) issues.push('MISSING og:title');
  if (!/<meta\s+property=["']og:description["']/i.test(html)) issues.push('MISSING og:description');
  if (!/<meta\s+property=["']og:image["']/i.test(html)) issues.push('MISSING og:image');

  // Canonical
  if (!/<link\s+rel=["']canonical["']/i.test(html)) issues.push('MISSING canonical URL');

  // theme-color
  if (!/<meta\s+name=["']theme-color["']/i.test(html)) issues.push('MISSING theme-color');

  return { path: rel, title: title || '(none)', issues };
}

// --- Run ---
const files = findHtmlFiles(ROOT);
const results = files.map(audit);
const withIssues = results.filter(r => r.issues.length > 0);
const perfect = results.filter(r => r.issues.length === 0);

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║               AFROTOOLS — META TAGS AUDIT REPORT               ║');
console.log('╚══════════════════════════════════════════════════════════════════╝');
console.log(`\nScanned: ${results.length} HTML files`);
console.log(`Issues found: ${withIssues.length} files | Perfect: ${perfect.length} files\n`);

if (withIssues.length) {
  console.log('─── FILES WITH ISSUES ───────────────────────────────────────────\n');
  for (const r of withIssues) {
    console.log(`  ${r.path}`);
    for (const issue of r.issues) {
      console.log(`    ⚠  ${issue}`);
    }
    console.log('');
  }
}

if (perfect.length) {
  console.log('─── PERFECT FILES ──────────────────────────────────────────────\n');
  for (const r of perfect) {
    console.log(`  ✓ ${r.path}`);
  }
}

console.log(`\n── Summary ────────────────────────────────────────────────────`);
const issueCounts = {};
for (const r of withIssues) {
  for (const issue of r.issues) {
    const key = issue.replace(/\(\d+ chars\)/, '(N chars)');
    issueCounts[key] = (issueCounts[key] || 0) + 1;
  }
}
for (const [issue, count] of Object.entries(issueCounts).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(3)} × ${issue}`);
}
console.log('');
