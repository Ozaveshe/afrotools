#!/usr/bin/env node
/**
 * audit-fix-og-twitter.js — Comprehensive OG/Twitter Card audit & fix for ALL pages.
 *
 * Checks for and adds missing:
 *  - og:locale (en_US for English, fr_FR for French)
 *  - og:locale:alternate (other language variant)
 *  - og:site_name
 *  - twitter:card
 *  - twitter:title
 *  - twitter:description
 *  - twitter:image
 *
 * Usage:
 *   node scripts/audit-fix-og-twitter.js             (audit only)
 *   node scripts/audit-fix-og-twitter.js --fix        (apply fixes)
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const FIX = process.argv.includes('--fix');
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', 'assets', 'scripts',
  'lang', 'data', 'supabase', 'netlify', '.netlify', 'docs'
]);

const LOCALE_MAP = { en: 'en_US', fr: 'fr_FR', sw: 'sw_KE', yo: 'yo_NG', ha: 'ha_NG' };

function walkHtml(dir) {
  const results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      results.push(...walkHtml(path.join(dir, entry.name)));
    } else if (entry.name.endsWith('.html')) {
      results.push(path.join(dir, entry.name));
    }
  }
  return results;
}

function inferLang(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.startsWith('fr/')) return 'fr';
  if (rel.startsWith('sw/')) return 'sw';
  if (rel.startsWith('yo/')) return 'yo';
  if (rel.startsWith('ha/')) return 'ha';
  return 'en';
}

function extract(html, regex) {
  const m = html.match(regex);
  return m ? m[1] : null;
}

function hasTag(html, pattern) {
  return pattern.test(html);
}

function processFile(filePath) {
  let html = fs.readFileSync(filePath, 'utf-8');
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const lang = inferLang(filePath);
  const locale = LOCALE_MAP[lang] || 'en_US';
  const altLocale = lang === 'fr' ? 'en_US' : 'fr_FR';
  const fixes = [];
  let modified = false;

  // Skip files without a <head> tag (fragments, templates)
  if (!/<head[\s>]/i.test(html)) return null;

  // Extract existing values
  const ogTitle = extract(html, /<meta\s+property=["']og:title["']\s+content=["']([^"']*)["']/i);
  const ogDesc = extract(html, /<meta\s+property=["']og:description["']\s+content=["']([^"']*)["']/i);
  const ogImage = extract(html, /<meta\s+property=["']og:image["']\s+content=["']([^"']*)["']/i);
  const title = extract(html, /<title>([^<]*)<\/title>/i);
  const desc = extract(html, /<meta\s+name=["']description["']\s+content=["']([^"']*)["']/i);

  function insertBefore(tag) {
    html = html.replace('</head>', tag + '\n</head>');
    modified = true;
  }

  // 1. og:locale
  if (!hasTag(html, /<meta\s+property=["']og:locale["']/i)) {
    fixes.push(`og:locale="${locale}"`);
    if (FIX) insertBefore(`<meta property="og:locale" content="${locale}">`);
  }

  // 2. og:locale:alternate
  if (!hasTag(html, /<meta\s+property=["']og:locale:alternate["']/i)) {
    fixes.push(`og:locale:alternate="${altLocale}"`);
    if (FIX) insertBefore(`<meta property="og:locale:alternate" content="${altLocale}">`);
  }

  // 3. og:site_name
  if (!hasTag(html, /<meta\s+property=["']og:site_name["']/i)) {
    fixes.push('og:site_name');
    if (FIX) insertBefore('<meta property="og:site_name" content="AfroTools">');
  }

  // 4. twitter:card
  if (!hasTag(html, /<meta\s+name=["']twitter:card["']/i)) {
    fixes.push('twitter:card');
    if (FIX) insertBefore('<meta name="twitter:card" content="summary_large_image">');
  }

  // 5. twitter:title
  if (!hasTag(html, /<meta\s+name=["']twitter:title["']/i)) {
    const val = ogTitle || title || '';
    if (val) {
      fixes.push('twitter:title');
      if (FIX) insertBefore(`<meta name="twitter:title" content="${val.replace(/"/g, '&quot;')}">`);
    }
  }

  // 6. twitter:description
  if (!hasTag(html, /<meta\s+name=["']twitter:description["']/i)) {
    const val = ogDesc || desc || '';
    if (val) {
      fixes.push('twitter:description');
      if (FIX) insertBefore(`<meta name="twitter:description" content="${val.replace(/"/g, '&quot;')}">`);
    }
  }

  // 7. twitter:image
  if (!hasTag(html, /<meta\s+name=["']twitter:image["']/i)) {
    const val = ogImage || 'https://afrotools.com/assets/img/og-default.png';
    fixes.push('twitter:image');
    if (FIX) insertBefore(`<meta name="twitter:image" content="${val}">`);
  }

  if (FIX && modified) {
    fs.writeFileSync(filePath, html, 'utf-8');
  }

  return fixes.length > 0 ? { path: rel, fixes } : null;
}

// ── Main ─────────────────────────────────────────────────────────────────────

const files = walkHtml(ROOT);
const results = files.map(processFile).filter(Boolean);
const totalScanned = files.length;

console.log('\n🔍 OG/Twitter Card Audit Report');
console.log('═'.repeat(60));
console.log(`📄 ${totalScanned} pages scanned`);
console.log(`✅ ${totalScanned - results.length} pages complete`);
console.log(`${FIX ? '🔧' : '⚠️ '} ${results.length} pages ${FIX ? 'fixed' : 'need fixes'}`);
console.log('');

if (results.length > 0) {
  const fixCounts = {};
  for (const r of results) {
    for (const f of r.fixes) {
      const key = f.split('=')[0].trim();
      fixCounts[key] = (fixCounts[key] || 0) + 1;
    }
  }

  console.log('Missing tags breakdown:');
  for (const [fix, count] of Object.entries(fixCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)} × ${fix}`);
  }

  if (!FIX) {
    console.log(`\nRun with --fix to apply all changes.`);
  } else {
    console.log(`\n✅ All fixes applied.`);
  }
}

console.log('');
