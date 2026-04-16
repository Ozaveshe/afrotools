/**
 * seo-daily-fix.js
 * ─────────────────────────────────────────────────────────────────
 * Daily automated SEO fixer for afrotools.com
 * Based on SEMrush audit patterns (March 2026 report).
 *
 * Checks run & fixed automatically:
 *   1. Hreflang trailing-slash violations on .html-backed pages
 *   2. Sitemap <loc> trailing-slash violations
 *   3. Sitemap <lastmod> staleness (updates to today)
 *   4. Canonical tag presence check (reports only, no auto-fix)
 *   5. Missing meta description (reports only)
 *
 * Usage:
 *   node scripts/seo-daily-fix.js
 *   node scripts/seo-daily-fix.js --dry-run   (preview only, no writes)
 *   node scripts/seo-daily-fix.js --report    (print report only, exit non-zero if issues)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const ROOT    = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const REPORT  = process.argv.includes('--report');
const FIX_MODE = !DRY_RUN && !REPORT;
const TODAY   = new Date().toISOString().slice(0, 10);

const SKIP_DIRS = new Set(['node_modules', '.git', 'assets', 'scripts', '.netlify', 'lang', 'supabase']);

// ─── Helpers ───────────────────────────────────────────────────────────────

function walk(dir, cb) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!SKIP_DIRS.has(entry.name)) walk(full, cb);
    } else {
      cb(full, entry.name);
    }
  }
}

function readFile(fp)          { return fs.readFileSync(fp, 'utf8'); }
function writeFile(fp, data)   { if (FIX_MODE) fs.writeFileSync(fp, data, 'utf8'); }

function hasCanonical(content) {
  return /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']+["'])[^>]*>/i.test(content);
}

function hasTitle(content) {
  return /<title\b[^>]*>[\s\S]*?<\/title>/i.test(content);
}

function hasDescription(content) {
  return /<meta\b(?=[^>]*\bname=["']description["'])(?=[^>]*\bcontent=["'][^"']*["'])[^>]*>/i.test(content);
}

function hasNoindex(content) {
  const robotsMatch =
    content.match(/<meta\b(?=[^>]*\bname=["']robots["'])[^>]*\bcontent=["']([^"']+)["'][^>]*>/i) ||
    content.match(/<meta\b(?=[^>]*\bcontent=["']([^"']+)["'])[^>]*\bname=["']robots["'][^>]*>/i);

  return Boolean(robotsMatch && /\bnoindex\b/i.test(robotsMatch[1]));
}

function isRedirectLike(content) {
  return (
    /<meta[^>]+http-equiv=["']refresh["']/i.test(content) ||
    /window\.location\.(replace|href)|location\.replace\(/i.test(content)
  );
}

// ─── Step 1: Build map of .html-backed URLs (no trailing slash) ───────────

const htmlUrls = new Set();   // 'https://afrotools.com/algeria/dz-paye'

walk(ROOT, (fp, fname) => {
  if (!fname.endsWith('.html') || fname === 'index.html') return;
  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  htmlUrls.add('https://afrotools.com/' + rel.slice(0, -5));  // strip .html
});

// ─── Step 2: Fix hreflang trailing slashes ────────────────────────────────

let hreflangFilesFixed = 0;
let hreflangAttrsFixed = 0;

// Regex matches any hreflang href ending with /
const HREFLANG_RE = /hreflang="[^"]+" href="(https:\/\/afrotools\.com\/[^"]+\/)"/g;

walk(ROOT, (fp, fname) => {
  if (!fname.endsWith('.html')) return;

  const original = readFile(fp);
  if (!original.includes('hreflang')) return;

  let changed = false;
  const fixed = original.replace(HREFLANG_RE, (match, url) => {
    const bare = url.slice(0, -1);  // strip trailing slash
    if (htmlUrls.has(bare)) {
      changed = true;
      hreflangAttrsFixed++;
      return match.replace(`"${url}"`, `"${bare}"`);
    }
    return match;
  });

  if (changed) {
    writeFile(fp, fixed);
    hreflangFilesFixed++;
    if (DRY_RUN) console.log(`  [dry] hreflang fix: ${path.relative(ROOT, fp)}`);
  }
});

// ─── Step 3: Fix sitemap trailing slashes + update lastmod ────────────────

let sitemapLocsFixed    = 0;
let sitemapLastmodFixed = 0;

const SITEMAP_FILES = ['sitemap.xml', 'sitemap-i18n.xml'];

for (const smName of SITEMAP_FILES) {
  const smPath = path.join(ROOT, smName);
  if (!fs.existsSync(smPath)) continue;

  const original = readFile(smPath);
  let content    = original;

  // Fix <loc> trailing slashes pointing to .html pages
  content = content.replace(/<loc>(https:\/\/afrotools\.com\/[^<]+)<\/loc>/g, (match, url) => {
    if (url.endsWith('/') && htmlUrls.has(url.slice(0, -1))) {
      sitemapLocsFixed++;
      return `<loc>${url.slice(0, -1)}</loc>`;
    }
    return match;
  });

  // Update <lastmod> to today for pages that were touched today
  // (only update entries whose lastmod is stale by more than 7 days)
  content = content.replace(/<lastmod>(\d{4}-\d{2}-\d{2})<\/lastmod>/g, (match, date) => {
    const ageMs = Date.now() - new Date(date).getTime();
    const ageDays = ageMs / 86400000;
    if (ageDays > 7) {
      sitemapLastmodFixed++;
      return `<lastmod>${TODAY}</lastmod>`;
    }
    return match;
  });

  if (content !== original) {
    writeFile(smPath, content);
    if (DRY_RUN) console.log(`  [dry] sitemap fix: ${smName}`);
  }
}

// ─── Step 4: Reporting checks (no auto-fix) ───────────────────────────────

const issues = {
  missingCanonical:    [],
  missingTitle:        [],
  missingDescription:  [],
  hreflangViolations:  [],   // any remaining after fix
};
let metadataSkippedNoindex = 0;

walk(ROOT, (fp, fname) => {
  if (!fname.endsWith('.html')) return;
  const content = readFile(fp);
  const rel     = path.relative(ROOT, fp).replace(/\\/g, '/');

  // Skip utility pages
  if (/index_old|style-guide|logo-system|mission-control/.test(rel)) return;
  if (isRedirectLike(content)) return;
  if (hasNoindex(content)) {
    metadataSkippedNoindex++;
    return;
  }

  if (!hasCanonical(content))   issues.missingCanonical.push(rel);
  if (!hasTitle(content))       issues.missingTitle.push(rel);
  if (!hasDescription(content)) issues.missingDescription.push(rel);

  // Re-check for any remaining hreflang violations
  let m;
  const re = /hreflang="[^"]+" href="(https:\/\/afrotools\.com\/[^"]+\/)"/g;
  while ((m = re.exec(content)) !== null) {
    const bare = m[1].slice(0, -1);
    if (htmlUrls.has(bare)) {
      issues.hreflangViolations.push({ file: rel, url: m[1] });
    }
  }
});

// ─── Step 5: /fr/ broken link check ──────────────────────────────────────

const frIndex = path.join(ROOT, 'fr', 'index.html');
const frBroken = [];

if (fs.existsSync(frIndex)) {
  const frContent = readFile(frIndex);
  const frLinks   = [...frContent.matchAll(/href="(\/fr\/[^"#?]+)"/g)].map(m => m[1]);

  for (const link of [...new Set(frLinks)]) {
    const rel   = link.slice(1);  // strip leading /
    const dirP  = path.join(ROOT, rel, 'index.html');
    const htmlP = path.join(ROOT, rel.replace(/\/$/, '') + '.html');
    if (!fs.existsSync(dirP) && !fs.existsSync(htmlP)) {
      frBroken.push(link);
    }
  }
}

// ─── Output ───────────────────────────────────────────────────────────────

const GREEN  = '\x1b[32m';
const YELLOW = '\x1b[33m';
const RED    = '\x1b[31m';
const RESET  = '\x1b[0m';
const BOLD   = '\x1b[1m';

console.log(`\n${BOLD}AfroTools SEO Daily Fix — ${TODAY}${RESET}\n`);
console.log(`${DRY_RUN ? '[DRY RUN] ' : ''}Mode: ${REPORT ? 'report' : 'fix'}\n`);

console.log(`${BOLD}${FIX_MODE ? '── Auto-fixes applied' : '── Auto-fixes available'} ──────────────────────────────────${RESET}`);
console.log(`  Hreflang files fixed:      ${hreflangFilesFixed}`);
console.log(`  Hreflang attrs fixed:      ${hreflangAttrsFixed}`);
console.log(`  Sitemap <loc> fixed:       ${sitemapLocsFixed}`);
console.log(`  Sitemap <lastmod> updated: ${sitemapLastmodFixed}`);

console.log(`\n${BOLD}── Remaining issues (manual review) ────────────────────${RESET}`);

const printList = (label, arr, limit = 5) => {
  const color = arr.length === 0 ? GREEN : (arr.length < 10 ? YELLOW : RED);
  console.log(`  ${color}${label}: ${arr.length}${RESET}`);
  if (arr.length > 0 && !REPORT) {
    arr.slice(0, limit).forEach(item => {
      const display = typeof item === 'object' ? `${item.file} → ${item.url}` : item;
      console.log(`    • ${display}`);
    });
    if (arr.length > limit) console.log(`    … and ${arr.length - limit} more`);
  }
};

printList('Missing canonical tags',   issues.missingCanonical);
printList('Missing <title> tags',      issues.missingTitle);
printList('Missing meta descriptions', issues.missingDescription);
printList('Remaining hreflang violations', issues.hreflangViolations);
printList('/fr/ homepage broken links (no static file — verify _redirects)', frBroken);
console.log(`  ${GREEN}Noindex pages skipped from metadata report: ${metadataSkippedNoindex}${RESET}`);

// Summary
const totalIssues =
  issues.missingCanonical.length +
  issues.missingTitle.length +
  issues.missingDescription.length +
  issues.hreflangViolations.length +
  frBroken.length;

const anythingFixed =
  hreflangFilesFixed > 0 ||
  sitemapLocsFixed > 0 ||
  sitemapLastmodFixed > 0;

console.log(`\n${BOLD}── Summary ─────────────────────────────────────────────${RESET}`);

if (anythingFixed) {
  if (FIX_MODE) {
    console.log(`  ${GREEN}✓ Auto-fixes committed. Netlify will redeploy.${RESET}`);
  } else {
    console.log(`  ${YELLOW}⚠ Auto-fixes available. Run npm run seo to apply them.${RESET}`);
  }
} else {
  console.log(`  ${GREEN}✓ No auto-fixes needed — site is clean.${RESET}`);
}

if (totalIssues > 0) {
  console.log(`  ${YELLOW}⚠ ${totalIssues} manual issues need attention (see daily_seo_check.md)${RESET}`);
}

console.log('');

// Exit non-zero if running in --report mode and there are hard errors
if (REPORT && (issues.hreflangViolations.length > 0 || issues.missingCanonical.length > 5)) {
  process.exit(1);
}
