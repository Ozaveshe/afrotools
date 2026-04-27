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

const {
  fileToPublicRoute,
  fileToSourceHtmlRoute,
} = require('./lib/canonical-aliases');

const ROOT    = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const REPORT  = process.argv.includes('--report');
const FIX_MODE = !DRY_RUN && !REPORT;
const TODAY   = new Date().toISOString().slice(0, 10);
const SITE_ORIGIN = 'https://afrotools.com';

const SKIP_DIRS = new Set(['node_modules', '.git', 'assets', 'scripts', '.netlify', 'dist', 'lang', 'supabase']);

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

function extractCanonicalHref(content) {
  const match =
    content.match(/<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["']([^"']+)["'])[^>]*>/i) ||
    content.match(/<link\b(?=[^>]*\bhref=["']([^"']+)["'])(?=[^>]*\brel=["']canonical["'])[^>]*>/i);

  return match ? match[1] : '';
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
  const headEnd = content.search(/<\/head>/i);
  const snippet = headEnd === -1 ? content.slice(0, 2500) : content.slice(0, headEnd + 7);

  return (
    /<meta[^>]+http-equiv=["']refresh["']/i.test(content) ||
    /window\.location\.replace\(\s*['"][^'"]+['"]\s*\)/i.test(snippet) ||
    /location\.replace\(\s*['"][^'"]+['"]\s*\)/i.test(snippet) ||
    /window\.location(?:\.href)?\s*=\s*['"][^'"]+['"]/i.test(snippet) ||
    /location\.href\s*=\s*['"][^'"]+['"]/i.test(snippet)
  );
}

function normalizeSiteUrl(url) {
  try {
    const parsed = new URL(url, SITE_ORIGIN);
    if (parsed.origin !== SITE_ORIGIN) return '';

    let pathname = parsed.pathname;
    if (pathname.endsWith('/index/')) {
      pathname = pathname.slice(0, -'index/'.length);
    } else if (pathname.endsWith('/index')) {
      pathname = pathname.slice(0, -'index'.length);
    }

    return `${parsed.origin}${pathname || '/'}`;
  } catch {
    return '';
  }
}

function defaultPageUrl(filePath) {
  return `${SITE_ORIGIN}${fileToPublicRoute(filePath)}`;
}

function resolvePreferredPageUrl(filePath, content) {
  return defaultPageUrl(filePath);
}

function upsertCanonical(content, url) {
  const line = `<link rel="canonical" href="${url}">`;
  const pattern =
    /<link\b(?=[^>]*\brel=["']canonical["'])(?=[^>]*\bhref=["'][^"']+["'])[^>]*>/i;

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  return content.replace(/<\/head>/i, `${line}\n</head>`);
}

function upsertOgUrl(content, url) {
  const line = `<meta property="og:url" content="${url}">`;
  const pattern =
    /<meta\b(?=[^>]*\bproperty=["']og:url["'])(?=[^>]*\bcontent=["'][^"']*["'])[^>]*>/i;

  if (pattern.test(content)) {
    return content.replace(pattern, line);
  }

  return content.replace(/<\/head>/i, `${line}\n</head>`);
}

function normalizeKnownSiteUrl(url) {
  if (
    typeof url !== 'string' ||
    (
      !url.startsWith('/') &&
      !url.startsWith(`${SITE_ORIGIN}/`) &&
      url !== SITE_ORIGIN
    )
  ) {
    return url;
  }

  const preferred = preferredPageUrls.get(normalizeSiteUrl(url));
  return preferred || url;
}

function normalizeJsonLdValue(value) {
  if (Array.isArray(value)) {
    return value.map(normalizeJsonLdValue);
  }

  if (!value || typeof value !== 'object') {
    return typeof value === 'string' ? normalizeKnownSiteUrl(value) : value;
  }

  for (const key of Object.keys(value)) {
    value[key] = normalizeJsonLdValue(value[key]);
  }

  return value;
}

function normalizeJsonLdUrls(content) {
  let blocksFixed = 0;

  const next = content.replace(
    /<script\b([^>]*type=["']application\/ld\+json["'][^>]*)>([\s\S]*?)<\/script>/gi,
    (match, attrs, jsonText) => {
      const trimmed = jsonText.trim();
      if (!trimmed) return match;

      try {
        const parsed = JSON.parse(trimmed);
        const before = JSON.stringify(parsed);
        const normalized = normalizeJsonLdValue(parsed);
        const after = JSON.stringify(normalized);

        if (before === after) return match;

        blocksFixed += 1;
        return `<script${attrs}>${after}</script>`;
      } catch {
        return match;
      }
    }
  );

  return { content: next, blocksFixed };
}

// ─── Step 1: Build map of .html-backed URLs (no trailing slash) ───────────

const preferredPageUrls = new Map();

walk(ROOT, (fp, fname) => {
  if (!fname.endsWith('.html')) return;

  const content = readFile(fp);
  if (isRedirectLike(content)) return;

  const preferredUrl = resolvePreferredPageUrl(fp, content);
  const lookupKeys = [normalizeSiteUrl(preferredUrl)];
  const sourceHtmlRoute = fileToSourceHtmlRoute(fp);

  if (sourceHtmlRoute) {
    lookupKeys.push(normalizeSiteUrl(`${SITE_ORIGIN}${sourceHtmlRoute}`));
  }

  for (const lookupKey of lookupKeys) {
    if (lookupKey) preferredPageUrls.set(lookupKey, preferredUrl);
  }
});

// ─── Step 2: Fix hreflang trailing slashes ────────────────────────────────

let canonicalFilesFixed = 0;
let canonicalAttrsFixed = 0;
let ogUrlFilesFixed     = 0;
let ogUrlAttrsFixed     = 0;
let jsonLdFilesFixed    = 0;
let jsonLdBlocksFixed   = 0;

walk(ROOT, (fp, fname) => {
  if (!fname.endsWith('.html')) return;

  const rel = path.relative(ROOT, fp).replace(/\\/g, '/');
  if (/^(404\.html|style-guide\.html|logo-system\.html|afrotools-mission-control\.html|mc-7a2f9x\.html)$/i.test(rel)) {
    return;
  }

  const original = readFile(fp);
  if (isRedirectLike(original)) return;
  if (hasNoindex(original)) return;

  const preferredUrl = defaultPageUrl(fp);
  const currentCanonical = extractCanonicalHref(original);
  let next = upsertCanonical(original, preferredUrl);
  if (currentCanonical !== preferredUrl) {
    canonicalAttrsFixed++;
  }

  const ogUrlMatch =
    original.match(/<meta\b(?=[^>]*\bproperty=["']og:url["'])(?=[^>]*\bcontent=["']([^"']*)["'])[^>]*>/i) ||
    original.match(/<meta\b(?=[^>]*\bcontent=["']([^"']*)["'])(?=[^>]*\bproperty=["']og:url["'])[^>]*>/i);
  const currentOgUrl = ogUrlMatch ? ogUrlMatch[1] : '';
  next = upsertOgUrl(next, preferredUrl);
  if (currentOgUrl !== preferredUrl) {
    ogUrlAttrsFixed++;
  }

  const normalizedJsonLd = normalizeJsonLdUrls(next);
  next = normalizedJsonLd.content;
  if (normalizedJsonLd.blocksFixed > 0) {
    jsonLdFilesFixed++;
    jsonLdBlocksFixed += normalizedJsonLd.blocksFixed;
  }

  if (next !== original) {
    writeFile(fp, next);
    if (currentCanonical !== preferredUrl) canonicalFilesFixed++;
    if (currentOgUrl !== preferredUrl) ogUrlFilesFixed++;
    if (DRY_RUN) console.log(`  [dry] seo self-url fix: ${rel}`);
  }
});

// â”€â”€â”€ Step 3: Fix hreflang trailing slashes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

let hreflangFilesFixed = 0;
let hreflangAttrsFixed = 0;

const HREFLANG_RE = /hreflang="[^"]+" href="(https:\/\/afrotools\.com\/[^"]+)"/g;

walk(ROOT, (fp, fname) => {
  if (!fname.endsWith('.html')) return;

  const original = readFile(fp);
  if (!original.includes('hreflang')) return;

  let changed = false;
  const fixed = original.replace(HREFLANG_RE, (match, url) => {
    const preferredUrl = preferredPageUrls.get(normalizeSiteUrl(url));
    if (preferredUrl && preferredUrl !== url) {
      changed = true;
      hreflangAttrsFixed++;
      return match.replace(`"${url}"`, `"${preferredUrl}"`);
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
let sitemapHrefFixed    = 0;
let sitemapLastmodFixed = 0;

const SITEMAP_FILES = fs
  .readdirSync(ROOT)
  .filter((name) => /^sitemap.*\.xml$/i.test(name))
  .sort();

if (fs.existsSync(path.join(ROOT, 'jamb', 'sitemap.xml'))) {
  SITEMAP_FILES.push('jamb/sitemap.xml');
}

for (const smName of SITEMAP_FILES) {
  const smPath = path.join(ROOT, smName);
  if (!fs.existsSync(smPath)) continue;

  const original = readFile(smPath);
  let content    = original;

  // Normalize <loc> values to the page's preferred canonical URL.
  content = content.replace(/<loc>(https:\/\/afrotools\.com\/[^<]+)<\/loc>/g, (match, url) => {
    const preferredUrl = preferredPageUrls.get(normalizeSiteUrl(url));
    if (preferredUrl && preferredUrl !== url) {
      sitemapLocsFixed++;
      return `<loc>${preferredUrl}</loc>`;
    }
    return match;
  });

  content = content.replace(/href="(https:\/\/afrotools\.com\/[^"]+)"/g, (match, url) => {
    const preferredUrl = preferredPageUrls.get(normalizeSiteUrl(url));
    if (preferredUrl && preferredUrl !== url) {
      sitemapHrefFixed++;
      return `href="${preferredUrl}"`;
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
  const re = /hreflang="[^"]+" href="(https:\/\/afrotools\.com\/[^"]+)"/g;
  while ((m = re.exec(content)) !== null) {
    const preferredUrl = preferredPageUrls.get(normalizeSiteUrl(m[1]));
    if (preferredUrl && preferredUrl !== m[1]) {
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
console.log(`  Canonical files fixed:     ${canonicalFilesFixed}`);
console.log(`  Canonical attrs fixed:     ${canonicalAttrsFixed}`);
console.log(`  og:url files fixed:        ${ogUrlFilesFixed}`);
console.log(`  og:url attrs fixed:        ${ogUrlAttrsFixed}`);
console.log(`  JSON-LD files fixed:       ${jsonLdFilesFixed}`);
console.log(`  JSON-LD blocks fixed:      ${jsonLdBlocksFixed}`);
console.log(`  Hreflang files fixed:      ${hreflangFilesFixed}`);
console.log(`  Hreflang attrs fixed:      ${hreflangAttrsFixed}`);
console.log(`  Sitemap <loc> fixed:       ${sitemapLocsFixed}`);
console.log(`  Sitemap hreflang fixed:    ${sitemapHrefFixed}`);
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
  canonicalFilesFixed > 0 ||
  ogUrlFilesFixed > 0 ||
  jsonLdFilesFixed > 0 ||
  hreflangFilesFixed > 0 ||
  sitemapLocsFixed > 0 ||
  sitemapHrefFixed > 0 ||
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
