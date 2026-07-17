#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const MANIFEST = path.join(ROOT, 'data/content/blog-article-manifest.json');
const BOOTSTRAP = process.argv.includes('--bootstrap');
const WRITE = process.argv.includes('--write');
const CHECK = process.argv.includes('--check') || (!BOOTSTRAP && !WRITE);

function parseAttributes(tag) {
  const attrs = {};
  for (const match of String(tag).matchAll(/([^\s=]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)) attrs[match[1].toLowerCase()] = match[2] === undefined ? match[3] : match[2];
  return attrs;
}

function readMeta(html, key) {
  for (const match of html.matchAll(/<meta\b[^>]*>/gi)) {
    const attrs = parseAttributes(match[0]);
    if ((attrs.name || attrs.property || '').toLowerCase() === key.toLowerCase()) return attrs.content || '';
  }
  return '';
}

function pageLocale(html) {
  const tag = html.match(/<html\b[^>]*>/i);
  return tag ? String(parseAttributes(tag[0]).lang || '').toLowerCase().split('-')[0] : '';
}

function categoryFromPage(html) {
  const explicit = readMeta(html, 'article:section');
  if (explicit) return explicit;
  const badge = html.match(/<span[^>]*class=["'][^"']*category-badge[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
  return badge ? badge[1].replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim() : 'Tools & Guides';
}

function contentId(locale, file) {
  return `blog:${locale}:${crypto.createHash('sha1').update(file).digest('hex').slice(0, 14)}`;
}

function articleFiles() {
  const files = [];
  for (const base of ['blog', 'fr/blog']) {
    const dir = path.join(ROOT, base);
    if (!fs.existsSync(dir)) continue;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name, 'index.html');
      if (entry.isDirectory() && fs.existsSync(file)) files.push(file);
    }
  }
  return files.sort();
}

function discover() {
  return articleFiles().map((absolute) => {
    const html = fs.readFileSync(absolute, 'utf8');
    const file = path.relative(ROOT, absolute).replace(/\\/g, '/');
    const locale = pageLocale(html);
    if (!locale) throw new Error(`${file}: missing explicit html lang`);
    const slug = path.basename(path.dirname(absolute));
    return {
      contentId: contentId(locale, file),
      file,
      slug,
      locale,
      category: categoryFromPage(html),
      publicationStatus: /<meta\b[^>]*name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html) ? 'unpublished' : 'published'
    };
  });
}

function injectMeta(html, name, content) {
  const existing = new RegExp(`<meta\\b[^>]*name=["']${name}["'][^>]*>`, 'i');
  const tag = `<meta name="${name}" content="${content}">`;
  return existing.test(html) ? html.replace(existing, tag) : html.replace(/<head>/i, `<head>\n${tag}`);
}

function cleanHtml(html) {
  return html.normalize('NFC').replace(/[ \t]+$/gm, '');
}

function syncMainListing(html, manifest) {
  const byFile = new Map(manifest.articles.map((row) => [row.file, row]));
  let count = 0;
  let output = html.replace(/<article\b[^>]*class=["'][^"']*article-card[^"']*["'][^>]*>[\s\S]*?<\/article>/gi, (card) => {
    const href = card.match(/href=["']\/blog\/([^/"'#?]+)\/?["']/i);
    if (!href) return card;
    const record = byFile.get(`blog/${href[1]}/index.html`);
    if (!record || record.locale !== 'en' || record.publicationStatus !== 'published') return '';
    count += 1;
    return /data-locale=/i.test(card) ? card : card.replace(/<article\b/i, '<article data-locale="en"');
  });
  output = output.replace(/\s*<button\b[^>]*data-cat=["']francais["'][^>]*>[\s\S]*?<\/button>/i, '');
  output = output.replace(/(<strong\b[^>]*id=["']statArticles["'][^>]*>)[^<]*(<\/strong>)/i, `$1${count}$2`);
  output = injectMeta(output, 'content-language', 'en');
  return { html: cleanHtml(output), count };
}

function listingErrors(file, locale, manifest) {
  if (!fs.existsSync(file)) return [`${path.relative(ROOT, file)}: locale listing is missing`];
  const html = fs.readFileSync(file, 'utf8');
  const byFile = new Map(manifest.articles.map((row) => [row.file, row]));
  const prefix = locale === 'fr' ? '/fr/blog/' : '/blog/';
  const base = locale === 'fr' ? 'fr/blog/' : 'blog/';
  const errors = [];
  const re = new RegExp(`href=["']${prefix.replace(/\//g, '\\/')}([^/"'#?]+)\\/?["']`, 'gi');
  for (const match of html.matchAll(re)) {
    if (/\.xml$/i.test(match[1])) continue;
    const record = byFile.get(`${base}${match[1]}/index.html`);
    if (!record) errors.push(`${path.relative(ROOT, file)}: ${match[1]} has no explicit locale record`);
    else if (record.locale !== locale) errors.push(`${path.relative(ROOT, file)}: ${match[1]} is ${record.locale}, not ${locale}`);
  }
  return errors;
}

function validate(manifest, discovered) {
  if (manifest.schemaVersion !== 1 || !Array.isArray(manifest.articles)) throw new Error('Blog manifest must use schemaVersion 1 and an articles array.');
  const byFile = new Map(manifest.articles.map((row) => [row.file, row]));
  const errors = [];
  for (const row of discovered) {
    const declared = byFile.get(row.file);
    if (!declared) errors.push(`${row.file}: missing manifest record`);
    else if (declared.locale !== row.locale) errors.push(`${row.file}: manifest locale ${declared.locale} does not match html lang ${row.locale}`);
  }
  for (const row of manifest.articles) if (!fs.existsSync(path.join(ROOT, row.file))) errors.push(`${row.file}: manifest source is missing`);
  return errors;
}

function main() {
  const discovered = discover();
  if (BOOTSTRAP) {
    fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
    fs.writeFileSync(MANIFEST, `${JSON.stringify({ schemaVersion: 1, generatedAt: '2026-07-12', articles: discovered }, null, 2)}\n`, 'utf8');
  }
  if (!fs.existsSync(MANIFEST)) throw new Error('Blog content manifest is missing; run with --bootstrap once.');
  const manifest = JSON.parse(fs.readFileSync(MANIFEST, 'utf8'));
  const errors = validate(manifest, discovered);
  const mainIndex = path.join(ROOT, 'blog/index.html');
  const mainBefore = fs.readFileSync(mainIndex, 'utf8');
  const mainListing = syncMainListing(mainBefore, manifest);
  if (mainListing.html !== mainBefore) {
    if (WRITE || BOOTSTRAP) fs.writeFileSync(mainIndex, mainListing.html, 'utf8');
    else errors.push('blog/index.html: locale listing is stale');
  }
  errors.push(...listingErrors(mainIndex, 'en', manifest));
  errors.push(...listingErrors(path.join(ROOT, 'fr/blog/index.html'), 'fr', manifest));
  if (errors.length) throw new Error(`Blog content manifest invalid:\n${errors.join('\n')}`);

  const stale = [];
  for (const row of manifest.articles) {
    const absolute = path.join(ROOT, row.file);
    const before = fs.readFileSync(absolute, 'utf8');
    let after = injectMeta(before, 'content-language', row.locale);
    after = injectMeta(after, 'afrotools-content-id', row.contentId);
    if (after === before) continue;
    if (WRITE || BOOTSTRAP) fs.writeFileSync(absolute, cleanHtml(after), 'utf8');
    else stale.push(row.file);
  }
  if (CHECK && stale.length) throw new Error(`Blog locale metadata is stale:\n${stale.slice(0, 50).join('\n')}`);
  console.log(`${BOOTSTRAP ? 'Bootstrapped' : WRITE ? 'Applied' : 'Checked'} blog locale manifest: ${manifest.articles.length} article(s), ${stale.length} stale.`);
}

if (require.main === module) main();

module.exports = { pageLocale, validate, contentId };
