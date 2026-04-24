#!/usr/bin/env node
/**
 * validate-hreflang.js — Validates hreflang implementation across all HTML pages.
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const BASE_URL = 'https://afrotools.com';
const VALID_LANGS = new Set(['en', 'fr', 'sw', 'yo', 'ha', 'x-default']);
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', 'assets', 'scripts',
  'lang', 'data', 'supabase', 'netlify', '.netlify', 'docs'
]);

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

function filePathToUrls(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  const urls = new Set();

  if (rel === 'index.html') {
    urls.add(`${BASE_URL}/`);
    return urls;
  }

  if (rel.endsWith('/index.html')) {
    urls.add(`${BASE_URL}/${rel.slice(0, -'index.html'.length)}`);
    return urls;
  }

  if (rel.endsWith('.html')) {
    const raw = `${BASE_URL}/${rel}`;
    urls.add(raw);
    const prettyTarget = path.join(ROOT, rel.slice(0, -'.html'.length), 'index.html');
    if (!fs.existsSync(prettyTarget)) {
      const pretty = `${BASE_URL}/${rel.slice(0, -'.html'.length)}/`;
      urls.add(pretty);
    }
    return urls;
  }

  urls.add(`${BASE_URL}/${rel}`);
  return urls;
}

function normalizeUrl(url) {
  try {
    const parsed = new URL(url, BASE_URL);
    parsed.hash = '';
    parsed.search = '';
    let normalized = `${parsed.origin}${parsed.pathname}`;
    if (!normalized.endsWith('/') && !normalized.endsWith('.html')) {
      normalized += '/';
    }
    return normalized;
  } catch {
    return url.endsWith('/') || url.endsWith('.html') ? url : `${url}/`;
  }
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
      tags.push({ lang: hreflangMatch[1].toLowerCase(), href: hrefMatch[1] });
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
  return match ? match[1].toLowerCase() : null;
}

function inferPageLang(filePath, htmlLang, hreflangs) {
  if (htmlLang && VALID_LANGS.has(htmlLang) && htmlLang !== 'x-default') return htmlLang;

  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.startsWith('fr/')) return 'fr';
  if (rel.startsWith('sw/')) return 'sw';
  if (rel.startsWith('yo/')) return 'yo';
  if (rel.startsWith('ha/')) return 'ha';

  const selfLike = hreflangs.find((h) => h.lang !== 'x-default');
  return selfLike ? selfLike.lang : 'en';
}

function main() {
  const errors = [];
  const warnings = [];
  let pagesChecked = 0;
  let pagesWithHreflang = 0;
  let totalPairs = 0;

  const allFiles = walkHtml(ROOT);
  const allUrls = new Set();
  for (const filePath of allFiles) {
    for (const url of filePathToUrls(filePath)) {
      allUrls.add(normalizeUrl(url));
    }
  }

  const pageData = new Map();
  for (const filePath of allFiles) {
    const html = fs.readFileSync(filePath, 'utf8');
    const urls = Array.from(filePathToUrls(filePath));
    const primaryUrl = urls[0];
    const hreflangs = extractHreflangTags(html);
    const canonical = extractCanonical(html);
    const htmlLang = extractHtmlLang(html);
    const expectedLang = inferPageLang(filePath, htmlLang, hreflangs);

    for (const url of urls) {
      pageData.set(normalizeUrl(url), {
        hreflangs,
        canonical,
        htmlLang,
        expectedLang,
        filePath,
        url: primaryUrl
      });
    }
    pagesChecked++;
  }

  const seenFiles = new Set();

  for (const filePath of allFiles) {
    const html = fs.readFileSync(filePath, 'utf8');
    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    if (seenFiles.has(rel)) continue;
    seenFiles.add(rel);

    const hreflangs = extractHreflangTags(html);
    if (!hreflangs.length) continue;

    const canonical = extractCanonical(html);
    const htmlLang = extractHtmlLang(html);
    const selfUrls = Array.from(filePathToUrls(filePath)).map(normalizeUrl);
    const expectedLang = inferPageLang(filePath, htmlLang, hreflangs);

    pagesWithHreflang++;
    totalPairs += hreflangs.length;

    const selfRef = hreflangs.find((h) => h.lang === expectedLang && selfUrls.includes(normalizeUrl(h.href)));
    if (!selfRef) {
      errors.push(`${rel} — missing self-reference (expected hreflang="${expectedLang}" pointing to self)`);
    }

    for (const h of hreflangs) {
      if (!/^https:\/\//i.test(h.href)) {
        errors.push(`${rel} — hreflang="${h.lang}" has non-absolute URL: ${h.href}`);
        continue;
      }
      if (!h.href.startsWith(BASE_URL)) {
        errors.push(`${rel} — hreflang="${h.lang}" points to wrong domain: ${h.href}`);
      }
      if (!VALID_LANGS.has(h.lang)) {
        errors.push(`${rel} — invalid hreflang code "${h.lang}" (allowed: en, fr, sw, yo, ha, x-default)`);
      }
    }

    if (!hreflangs.some((h) => h.lang === 'x-default')) {
      errors.push(`${rel} — missing x-default hreflang`);
    }

    for (const h of hreflangs) {
      if (h.lang === 'x-default') continue;
      if (!allUrls.has(normalizeUrl(h.href))) {
        errors.push(`${rel} — hreflang="${h.lang}" references ${h.href} but that file doesn't exist`);
      }
    }

    if (canonical) {
      const canonicalNorm = normalizeUrl(canonical);
      const canonicalIsSelf = selfUrls.includes(canonicalNorm);
      if (!canonical.startsWith(BASE_URL)) {
        errors.push(`${rel} — canonical points to wrong domain: ${canonical}`);
      } else if (!canonicalIsSelf) {
        const canonicalLang =
          canonical.includes('/fr/') ? 'fr' :
          canonical.includes('/sw/') ? 'sw' :
          canonical.includes('/yo/') ? 'yo' :
          canonical.includes('/ha/') ? 'ha' :
          expectedLang;
        if (canonicalLang !== expectedLang) {
          errors.push(`${rel} — canonical points to ${canonical} (different language version, should point to self)`);
        }
      }
    }

    const langCounts = {};
    for (const h of hreflangs) {
      langCounts[h.lang] = (langCounts[h.lang] || 0) + 1;
    }
    for (const [lang, count] of Object.entries(langCounts)) {
      if (count > 1) {
        errors.push(`${rel} — duplicate hreflang="${lang}" (appears ${count} times)`);
      }
    }

    if (htmlLang && htmlLang !== expectedLang) {
      errors.push(`${rel} — <html lang="${htmlLang}"> doesn't match expected language "${expectedLang}"`);
    }
  }

  for (const filePath of allFiles) {
    const html = fs.readFileSync(filePath, 'utf8');
    const hreflangs = extractHreflangTags(html);
    if (!hreflangs.length) continue;

    const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
    const htmlLang = extractHtmlLang(html);
    const expectedLang = inferPageLang(filePath, htmlLang, hreflangs);
    const sourceUrls = Array.from(filePathToUrls(filePath)).map(normalizeUrl);
    const sourceKey = sourceUrls[0];

    for (const h of hreflangs) {
      if (h.lang === 'x-default') continue;
      const targetData = pageData.get(normalizeUrl(h.href));
      if (!targetData) continue;

      const backRef = targetData.hreflangs.find((th) =>
        th.lang === expectedLang && sourceUrls.includes(normalizeUrl(th.href))
      );
      if (!backRef) {
        const targetRel = path.relative(ROOT, targetData.filePath).replace(/\\/g, '/');
        warnings.push(`${rel} → ${targetRel} — not bidirectional (${rel} references ${targetRel} but not vice versa)`);
      }
    }
  }

  console.log('\n🔍 Hreflang Validation Report');
  console.log('═'.repeat(60));
  console.log(`📄 ${pagesChecked} pages scanned`);
  console.log(`🏷️  ${pagesWithHreflang} pages with hreflang tags`);
  console.log(`🔗 ${totalPairs} hreflang pairs found`);
  console.log('');

  if (!errors.length && !warnings.length) {
    console.log('✅ All checks passed!');
  } else {
    if (errors.length) {
      console.log(`❌ ${errors.length} error(s):`);
      for (const error of errors) console.log(`   ❌ ${error}`);
    }
    if (warnings.length) {
      console.log(`\n⚠️  ${warnings.length} warning(s):`);
      for (const warning of warnings) console.log(`   ⚠️  ${warning}`);
    }
  }

  console.log('');
  process.exit(errors.length ? 1 : 0);
}

main();
