#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SITE_URL = 'https://afrotools.com';
const VALID_LANGS = new Set(['en', 'fr', 'sw', 'yo', 'ha']);
const SKIP_DIRS = new Set([
  'node_modules', '.git', '.claude', 'assets', 'scripts',
  'lang', 'data', 'supabase', 'netlify', '.netlify', 'docs'
]);
let EXISTING_URLS = null;

function walkHtml(dir) {
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue;
      files.push(...walkHtml(path.join(dir, entry.name)));
      continue;
    }
    if (entry.name.endsWith('.html')) {
      files.push(path.join(dir, entry.name));
    }
  }
  return files;
}

function inferLang(filePath, html) {
  const htmlLang = (html.match(/<html[^>]*\slang=["']([^"']+)["']/i) || [null, ''])[1].toLowerCase();
  if (VALID_LANGS.has(htmlLang)) return htmlLang;

  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel.startsWith('fr/')) return 'fr';
  if (rel.startsWith('sw/')) return 'sw';
  if (rel.startsWith('yo/')) return 'yo';
  if (rel.startsWith('ha/')) return 'ha';
  return 'en';
}

function filePathToUrl(filePath) {
  const rel = path.relative(ROOT, filePath).replace(/\\/g, '/');
  if (rel === 'index.html') return `${SITE_URL}/`;
  if (rel.endsWith('/index.html')) return `${SITE_URL}/${rel.slice(0, -'index.html'.length)}`;
  if (rel.endsWith('.html')) return `${SITE_URL}/${rel}`;
  return `${SITE_URL}/${rel}`;
}

function getCanonical(html, filePath) {
  const match = html.match(/<link\s+rel=["']canonical["']\s+href=["']([^"']+)["']/i);
  if (!match) return filePathToUrl(filePath);
  return normalizeSiteUrl(match[1]);
}

function parseAlternateTags(html) {
  const tags = [];
  const re = /<link\s[^>]*rel=["']alternate["'][^>]*>/gi;
  let match;
  while ((match = re.exec(html)) !== null) {
    const tag = match[0];
    const hreflangMatch = tag.match(/hreflang=["']([^"']+)["']/i);
    const hrefMatch = tag.match(/href=["']([^"']+)["']/i);
    if (!hreflangMatch || !hrefMatch) continue;
    tags.push({
      full: tag,
      start: match.index,
      end: match.index + tag.length,
      lang: hreflangMatch[1],
      href: hrefMatch[1]
    });
  }
  return tags;
}

function normalizeSiteUrl(url) {
  let normalized = url.trim();
  normalized = normalized.replace(/https?:\/\/+afrotools\.(org|net|com)/gi, SITE_URL);
  normalized = normalized.replace(/https:\/\/\/+afrotools\.com/gi, SITE_URL);
  normalized = normalized.replace(/^https:\/*/i, 'https://');
  normalized = normalized.replace(/^http:\/*/i, 'https://');
  normalized = normalized.replace(/\/index\/?$/i, '/');
  normalized = normalized.replace(/\.html\/$/i, '.html');
  return normalized;
}

function buildTag(lang, href) {
  return `<link rel="alternate" hreflang="${lang}" href="${href}" />`;
}

function urlExists(url) {
  return EXISTING_URLS && EXISTING_URLS.has(normalizeSiteUrl(url));
}

function replaceAlternateBlock(html, tags) {
  const existing = parseAlternateTags(html);
  const block = tags.join('\n');
  if (!existing.length) {
    return html.replace('</head>', `${block}\n</head>`);
  }

  const start = existing[0].start;
  let end = existing[existing.length - 1].end;
  while (end < html.length && /\s/.test(html[end])) end++;
  return html.slice(0, start) + block + '\n' + html.slice(end);
}

function fixFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let html = original.replace(/https:\/\/afrotools\.(org|net)/gi, SITE_URL);
  const expectedLang = inferLang(filePath, html);
  const originalCanonical = getCanonical(html, filePath);
  const selfHref = filePathToUrl(filePath);
  const canonical = originalCanonical.endsWith('.html/') || /\/index\/$/i.test(originalCanonical)
    ? selfHref
    : originalCanonical;
  const parsed = parseAlternateTags(html);
  const isAliasPage = normalizeSiteUrl(canonical) !== normalizeSiteUrl(selfHref);

  html = html.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])([^"']+)(["'])/i,
    (match, start, href, end) => `${start}${canonical}${end}`
  );

  if (isAliasPage) {
    html = replaceAlternateBlock(html, []);
    if (html !== original) {
      fs.writeFileSync(filePath, html, 'utf8');
      return true;
    }
    return false;
  }

  if (!parsed.length && expectedLang === 'en') {
    if (html !== original) {
      fs.writeFileSync(filePath, html, 'utf8');
      return true;
    }
    return false;
  }

  const byLang = new Map();
  for (const tag of parsed) {
    const lang = tag.lang.toLowerCase();
    const href = normalizeSiteUrl(tag.href);
    if (!byLang.has(lang)) {
      byLang.set(lang, href);
    }
  }

  byLang.set(expectedLang, selfHref);

  if (expectedLang !== 'en' && (byLang.get('en') === selfHref || byLang.get('en') === canonical)) {
    byLang.delete('en');
  }

  for (const [lang, href] of Array.from(byLang.entries())) {
    if (lang === expectedLang || lang === 'x-default') continue;
    if (!urlExists(href)) {
      byLang.delete(lang);
    }
  }

  const defaultHref = normalizeSiteUrl((byLang.has('en') && urlExists(byLang.get('en')) ? byLang.get('en') : selfHref));
  byLang.set('x-default', defaultHref);

  const ordered = [];
  for (const lang of ['en', 'fr', 'sw', 'yo', 'ha']) {
    if (byLang.has(lang)) {
      ordered.push(buildTag(lang, byLang.get(lang)));
    }
  }
  ordered.push(buildTag('x-default', byLang.get('x-default')));

  html = replaceAlternateBlock(html, ordered);

  if (html !== original) {
    fs.writeFileSync(filePath, html, 'utf8');
    return true;
  }
  return false;
}

function loadPageState(filePath) {
  const html = fs.readFileSync(filePath, 'utf8');
  const expectedLang = inferLang(filePath, html);
  const selfHref = filePathToUrl(filePath);
  const originalCanonical = getCanonical(html, filePath);
  const canonical = originalCanonical.endsWith('.html/') || /\/index\/$/i.test(originalCanonical)
    ? selfHref
    : originalCanonical;
  const byLang = new Map();

  for (const tag of parseAlternateTags(html)) {
    byLang.set(tag.lang.toLowerCase(), normalizeSiteUrl(tag.href));
  }

  return {
    filePath,
    html,
    expectedLang,
    selfHref,
    canonical,
    byLang
  };
}

function writePageState(state) {
  let html = state.html.replace(/https:\/\/afrotools\.(org|net)/gi, SITE_URL);
  const byLang = new Map(state.byLang);

  byLang.set(state.expectedLang, state.selfHref);

  for (const [lang, href] of Array.from(byLang.entries())) {
    if (lang === state.expectedLang || lang === 'x-default') continue;
    if (!urlExists(href)) {
      byLang.delete(lang);
    }
  }

  const defaultHref = normalizeSiteUrl((byLang.has('en') && urlExists(byLang.get('en')) ? byLang.get('en') : state.selfHref));
  byLang.set('x-default', defaultHref);

  const ordered = [];
  for (const lang of ['en', 'fr', 'sw', 'yo', 'ha']) {
    if (byLang.has(lang)) {
      ordered.push(buildTag(lang, byLang.get(lang)));
    }
  }
  ordered.push(buildTag('x-default', byLang.get('x-default')));

  html = html.replace(
    /(<link\s+rel=["']canonical["']\s+href=["'])([^"']+)(["'])/i,
    (match, start, href, end) => `${start}${state.canonical}${end}`
  );

  html = replaceAlternateBlock(html, ordered);

  if (html !== state.html) {
    fs.writeFileSync(state.filePath, html, 'utf8');
    state.html = html;
    return true;
  }

  state.html = html;
  return false;
}

function main() {
  const files = walkHtml(ROOT);
  EXISTING_URLS = new Set();
  for (const filePath of files) {
    EXISTING_URLS.add(filePathToUrl(filePath));
  }
  let changed = 0;
  for (const filePath of files) {
    if (fixFile(filePath)) changed++;
  }

  const pageStates = new Map();
  for (const filePath of files) {
    const state = loadPageState(filePath);
    pageStates.set(normalizeSiteUrl(state.selfHref), state);
  }

  for (const state of pageStates.values()) {
    const sourceLang = state.expectedLang;
    const sourceUrl = normalizeSiteUrl(state.selfHref);

    for (const [targetLang, targetHref] of Array.from(state.byLang.entries())) {
      if (targetLang === sourceLang || targetLang === 'x-default') continue;
      const targetState = pageStates.get(normalizeSiteUrl(targetHref));
      if (!targetState) {
        state.byLang.delete(targetLang);
        continue;
      }

      const existingBack = targetState.byLang.get(sourceLang);
      if (!existingBack) {
        targetState.byLang.set(sourceLang, sourceUrl);
        continue;
      }

      if (normalizeSiteUrl(existingBack) === sourceUrl) {
        continue;
      }

      if (!urlExists(existingBack)) {
        targetState.byLang.set(sourceLang, sourceUrl);
        continue;
      }

      state.byLang.delete(targetLang);
    }
  }

  for (const state of pageStates.values()) {
    if (writePageState(state)) changed++;
  }

  console.log(`Fixed hreflang/canonical markup in ${changed} file(s).`);
}

main();
