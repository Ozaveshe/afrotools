#!/usr/bin/env node
/**
 * AfroTools Broken Link Checker
 * Scans all HTML files for internal links and verifies targets exist on disk.
 * Run: node scripts/check-links.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IGNORE = ['.claude', 'node_modules', 'afrotools-deploy', '.git'];

function findHTMLFiles(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (IGNORE.includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...findHTMLFiles(full));
    } else if (entry.name.endsWith('.html')) {
      results.push(full);
    }
  }
  return results;
}

function extractLinks(html) {
  const links = [];
  const re = /href=["']([^"'#?]+)/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    const href = m[1].trim();
    // Only internal links
    if (href.startsWith('http') || href.startsWith('//') || href.startsWith('mailto:') ||
        href.startsWith('tel:') || href.startsWith('javascript:') || href.startsWith('data:')) continue;
    links.push(href);
  }
  return links;
}

function resolveLink(href) {
  let target = href;
  if (!target.startsWith('/')) return null; // skip relative for now
  target = target.replace(/\/$/, '');

  // Try: exact file, /index.html, .html
  const tries = [
    path.join(ROOT, target),
    path.join(ROOT, target, 'index.html'),
    path.join(ROOT, target + '.html'),
  ];

  for (const t of tries) {
    if (fs.existsSync(t)) return true;
  }
  return false;
}

// Run
const files = findHTMLFiles(ROOT);
console.log(`Scanning ${files.length} HTML files...\n`);

let brokenCount = 0;
const brokenMap = {};

for (const file of files) {
  const html = fs.readFileSync(file, 'utf8');
  const links = extractLinks(html);
  const rel = path.relative(ROOT, file);

  for (const href of links) {
    if (!href.startsWith('/')) continue; // skip relative
    const exists = resolveLink(href);
    if (!exists) {
      if (!brokenMap[href]) brokenMap[href] = [];
      brokenMap[href].push(rel);
      brokenCount++;
    }
  }
}

if (brokenCount === 0) {
  console.log('No broken internal links found!');
} else {
  console.log(`Found ${brokenCount} broken links across ${Object.keys(brokenMap).length} unique targets:\n`);
  const sorted = Object.entries(brokenMap).sort((a, b) => b[1].length - a[1].length);
  for (const [href, sources] of sorted) {
    console.log(`  BROKEN: ${href}`);
    console.log(`    Referenced by ${sources.length} file(s):`);
    sources.slice(0, 5).forEach(s => console.log(`      - ${s}`));
    if (sources.length > 5) console.log(`      ... and ${sources.length - 5} more`);
    console.log();
  }
}

process.exit(brokenCount > 0 ? 1 : 0);
