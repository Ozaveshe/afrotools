#!/usr/bin/env node
/**
 * fix-fr-internal-links.js — Fixes French pages that link to English tool/country pages.
 *
 * Rewrites internal links in /fr/ pages from English paths to French paths:
 *   /tools/X/         → /fr/tools/X/
 *   /nigeria/X         → /fr/nigeria/X
 *   /kenya/X           → /fr/kenya/X
 *   /ghana/X           → /fr/ghana/X
 *   /south-africa/X    → /fr/south-africa/X
 *   (etc. for all country paths)
 *
 * Excludes: stylesheet/script src, canonical/hreflang links, JSON-LD schemas
 *
 * Usage:
 *   node scripts/fix-fr-internal-links.js             (audit only)
 *   node scripts/fix-fr-internal-links.js --fix        (apply fixes)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');

// Countries that have tool pages
const COUNTRIES = [
  'algeria', 'angola', 'benin', 'botswana', 'burkina-faso', 'burundi',
  'cameroon', 'cape-verde', 'car', 'chad', 'comoros', 'congo',
  'cote-divoire', 'djibouti', 'dr-congo', 'egypt', 'eq-guinea',
  'equatorial-guinea', 'eritrea', 'eswatini', 'ethiopia', 'gabon',
  'gambia', 'ghana', 'guinea', 'guinea-bissau', 'kenya', 'lesotho',
  'liberia', 'libya', 'madagascar', 'malawi', 'mali', 'mauritania',
  'mauritius', 'morocco', 'mozambique', 'namibia', 'niger', 'nigeria',
  'rwanda', 'sao-tome', 'senegal', 'seychelles', 'sierra-leone',
  'somalia', 'south-africa', 'south-sudan', 'sudan', 'tanzania',
  'togo', 'tunisia', 'uganda', 'zambia', 'zimbabwe'
];

// Build regex for paths that should be /fr/ prefixed
// Match href="/tools/..." or href="/country/..."
const pathPatterns = [
  'tools/', 'crypto/',
  ...COUNTRIES.map(c => c + '/')
];

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (['node_modules', '.git'].includes(entry.name)) continue;
      results.push(...walkHtml(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.html')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const fixes = [];

  // Only process <a href="..."> tags (not <link>, <script>, JSON-LD)
  // Match anchor tags with href pointing to English paths
  const anchorPattern = /(<a\s[^>]*href=["'])(\/(?:tools|crypto|algeria|angola|benin|botswana|burkina-faso|burundi|cameroon|cape-verde|car|chad|comoros|congo|cote-divoire|djibouti|dr-congo|egypt|eq-guinea|equatorial-guinea|eritrea|eswatini|ethiopia|gabon|gambia|ghana|guinea|guinea-bissau|kenya|lesotho|liberia|libya|madagascar|malawi|mali|mauritania|mauritius|morocco|mozambique|namibia|niger|nigeria|rwanda|sao-tome|senegal|seychelles|sierra-leone|somalia|south-africa|south-sudan|sudan|tanzania|togo|tunisia|uganda|zambia|zimbabwe)\/[^"']*)(["'])/gi;

  let match;
  const replacements = [];
  while ((match = anchorPattern.exec(html)) !== null) {
    const before = match[1];
    const path = match[2];
    const after = match[3];
    const newPath = '/fr' + path;
    fixes.push(`${path} → ${newPath}`);
    replacements.push({ original: match[0], replacement: before + newPath + after });
  }

  if (FIX && replacements.length > 0) {
    for (const r of replacements) {
      html = html.replace(r.original, r.replacement);
    }
    fs.writeFileSync(filePath, html, 'utf-8');
  }

  return fixes.length > 0 ? { path: rel, fixes } : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const frDir = path.join(ROOT, 'fr');
const files = walkHtml(frDir);
const results = files.map(processFile).filter(Boolean);
const totalFixes = results.reduce((sum, r) => sum + r.fixes.length, 0);

console.log('\n🔍 French Internal Links Audit');
console.log('═'.repeat(60));
console.log(`📄 ${files.length} French pages scanned`);
console.log(`${FIX ? '🔧' : '⚠️ '} ${totalFixes} links ${FIX ? 'fixed' : 'need fixing'} across ${results.length} files`);

if (results.length > 0 && !FIX) {
  console.log('\nFiles with English links:');
  for (const r of results.slice(0, 20)) {
    console.log(`  ${r.path} (${r.fixes.length} links)`);
    for (const f of r.fixes.slice(0, 3)) {
      console.log(`    ${f}`);
    }
    if (r.fixes.length > 3) console.log(`    ... and ${r.fixes.length - 3} more`);
  }
  if (results.length > 20) console.log(`  ... and ${results.length - 20} more files`);
  console.log(`\nRun with --fix to apply.`);
} else if (FIX) {
  console.log(`\n✅ All links updated.`);
}

console.log('');
