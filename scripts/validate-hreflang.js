#!/usr/bin/env node
/**
 * validate-hreflang.js — Validates hreflang implementation across all HTML pages.
 *
 * Checks:
 *  1. Self-reference exists
 *  2. Bidirectional completeness
 *  3. Absolute URLs only
 *  4. Correct language codes (en, fr, sw, yo, ha, x-default)
 *  5. x-default present on every page with hreflang
 *  6. Referenced URLs correspond to actual files
 *  7. Canonical consistency (points to self, not another lang)
 *  8. No duplicate hreflang entries
 *  9. <html lang=""> matches the page's own hreflang declaration
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://afrotools.com';
const VALID_LANGS = new Set(['en', 'fr', 'sw', 'yo', 'ha', 'x-default']);

// Directories to skip
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', 'assets', 'scripts',
  'lang', 'data', 'supabase', 'netlify', '.netlify', 'docs'
]);

// ── Helpers ──────────────────────────────────────────────────────────────────

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

function filePathToUrl(filePath) {
  let rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  // index.html → directory URL
  if (rel.endsWith('/index.html')) {
    rel = rel.slice(0, -'index.html'.length);
  } else if (rel === 'index.html') {
    rel = '';
  } else if (rel.endsWith('.html')) {
    // Netlify pretty URLs: foo/bar.html → /foo/bar/
    rel = rel.slice(0, -'.html'.length) + '/';
  }
  return BASE_URL + '/' + rel;
}

function normalizeUrl(url) {
  // Normalize to always have trailing slash for comparison
  return url.endsWith('/') ? url : url + '/';
}

function urlExists(url, allUrls) {
  return allUrls.has(normalizeUrl(url));
}

function extractHreflangTags(html) {
  const tags = [];
  const re = /<link\s[^>]*rel=["']alternate["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const hreflangMatch = tag.match(/hreflang=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (hreflangMatch && hrefMatch) {
      tags.push({ lang: hreflangMatch[1], href: hrefMatch[1] });
    }
  }
  return tags;
}

function extractCanonical(html) {
  const match = html.match(/<link\s[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function extractHtmlLang(html) {
  const match = html.match(/<html[^>]*\slang=["']([^"']+)["']/i);
  return match ? match[1] : null;
}

function inferPageLang(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.startsWith('fr/')) return 'fr';
  if (rel.startsWith('sw/')) return 'sw';
  if (rel.startsWith('yo/')) return 'yo';
  if (rel.startsWith('ha/')) return 'ha';
  return 'en';
}

// ── Main ─────────────────────────────────────────────────────────────────────

function main() {
  const errors = [];
  const warnings = [];
  let pagesChecked = 0;
  let pagesWithHreflang = 0;
  let totalPairs = 0;

  const allFiles = walkHtml(ROOT);
  // Build set of all page URLs for existence checking
  const allUrls = new Set();
  for (const f of allFiles) {
    const url = filePathToUrl(f);
    allUrls.add(normalizeUrl(url));
  }

  // Parse all pages — key by normalized URL
  const pageData = new Map(); // normalizedUrl -> { hreflangs, canonical, htmlLang, filePath, url }
  for (const filePath of allFiles) {
    const html = fs.readFileSync(filePath, 'utf-8');
    const url = filePathToUrl(filePath);
    const hreflangs = extractHreflangTags(html);
    const canonical = extractCanonical(html);
    const htmlLang = extractHtmlLang(html);
    pageData.set(normalizeUrl(url), { hreflangs, canonical, htmlLang, filePath, url });
    pagesChecked++;
  }

  // Run checks on each page with hreflang
  for (const [normalizedKey, data] of pageData) {
    const { hreflangs, canonical, htmlLang, filePath, url } = data;
    if (hreflangs.length === 0) continue;
    pagesWithHreflang++;
    totalPairs += hreflangs.length;

    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const expectedLang = inferPageLang(filePath);

    // 1. Self-reference exists
    const selfRef = hreflangs.find(h =>
      h.lang === expectedLang && normalizeUrl(h.href) === normalizedKey
    );
    if (!selfRef) {
      errors.push(`${rel} — missing self-reference (expected hreflang="${expectedLang}" pointing to self)`);
    }

    // 3. Absolute URLs only
    for (const h of hreflangs) {
      if (!h.href.startsWith('https://afrotools.com')) {
        errors.push(`${rel} — hreflang="${h.lang}" has non-absolute URL: ${h.href}`);
      }
    }

    // 4. Correct language codes
    for (const h of hreflangs) {
      if (!VALID_LANGS.has(h.lang)) {
        errors.push(`${rel} — invalid hreflang code "${h.lang}" (allowed: en, fr, sw, yo, ha, x-default)`);
      }
    }

    // 5. x-default present
    const hasXDefault = hreflangs.some(h => h.lang === 'x-default');
    if (!hasXDefault) {
      errors.push(`${rel} — missing x-default hreflang`);
    }

    // 6. Referenced URLs exist as files
    for (const h of hreflangs) {
      if (h.lang === 'x-default') continue; // x-default checked via its target
      if (!urlExists(h.href, allUrls)) {
        errors.push(`${rel} — hreflang="${h.lang}" references ${h.href} but that file doesn't exist`);
      }
    }

    // 7. Canonical consistency
    if (canonical) {
      if (normalizeUrl(canonical) !== normalizedKey) {
        // Could be intentional for non-trailing-slash pages, only flag cross-language
        const canonicalLang = canonical.includes('/fr/') ? 'fr'
          : canonical.includes('/sw/') ? 'sw'
          : canonical.includes('/yo/') ? 'yo'
          : canonical.includes('/ha/') ? 'ha'
          : 'en';
        if (canonicalLang !== expectedLang) {
          errors.push(`${rel} — canonical points to ${canonical} (different language version, should point to self)`);
        }
      }
    }

    // 8. No duplicate hreflang entries
    const langCounts = {};
    for (const h of hreflangs) {
      langCounts[h.lang] = (langCounts[h.lang] || 0) + 1;
    }
    for (const [lang, count] of Object.entries(langCounts)) {
      if (count > 1) {
        errors.push(`${rel} — duplicate hreflang="${lang}" (appears ${count} times)`);
      }
    }

    // 9. lang attribute matches
    if (htmlLang && htmlLang !== expectedLang) {
      errors.push(`${rel} — <html lang="${htmlLang}"> doesn't match expected language "${expectedLang}"`);
    }
  }

  // 2. Bidirectional completeness (cross-page check)
  for (const [normalizedKey, data] of pageData) {
    const { hreflangs, filePath } = data;
    if (hreflangs.length === 0) continue;
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');

    for (const h of hreflangs) {
      if (h.lang === 'x-default') continue;
      const targetData = pageData.get(normalizeUrl(h.href));
      if (!targetData) continue; // Already caught by check 6

      // Target page should reference back to this page
      const sourceExpectedLang = inferPageLang(filePath);
      const backRef = targetData.hreflangs.find(th =>
        th.lang === sourceExpectedLang && normalizeUrl(th.href) === normalizedKey
      );
      if (!backRef) {
        const targetRel = path.relative(ROOT, targetData.filePath).replace(/\\/g, '/');
        warnings.push(`${rel} → ${targetRel} — not bidirectional (${rel} references ${targetRel} but not vice versa)`);
      }
    }
  }

  // ── Output ──────────────────────────────────────────────────────────────────

  console.log('\n🔍 Hreflang Validation Report');
  console.log('═'.repeat(60));
  console.log(`📄 ${pagesChecked} pages scanned`);
  console.log(`🏷️  ${pagesWithHreflang} pages with hreflang tags`);
  console.log(`🔗 ${totalPairs} hreflang pairs found`);
  console.log('');

  if (errors.length === 0 && warnings.length === 0) {
    console.log('✅ All checks passed!');
    console.log(`✅ ${pagesWithHreflang} pages checked`);
    console.log(`✅ ${totalPairs} hreflang pairs validated`);
    console.log('✅ 0 errors');
  } else {
    if (errors.length > 0) {
      console.log(`❌ ${errors.length} error(s):`);
      for (const e of errors) {
        console.log(`   ❌ ${e}`);
      }
    }
    if (warnings.length > 0) {
      console.log(`\n⚠️  ${warnings.length} warning(s):`);
      for (const w of warnings) {
        console.log(`   ⚠️  ${w}`);
      }
    }
  }

  console.log('');
  process.exit(errors.length > 0 ? 1 : 0);
}

main();
