'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/content/blog-article-manifest.json'), 'utf8'));
assert.strictEqual(manifest.schemaVersion, 1);
assert.ok(manifest.articles.length > 300);

const ids = new Set();
const byFile = new Map();
for (const row of manifest.articles) {
  assert.ok(!ids.has(row.contentId), `duplicate content id ${row.contentId}`);
  ids.add(row.contentId);
  byFile.set(row.file, row);
  const html = fs.readFileSync(path.join(ROOT, row.file), 'utf8');
  assert.match(html, new RegExp(`<meta\\s+name=["']content-language["']\\s+content=["']${row.locale}["']`, 'i'), `${row.file} content-language`);
  assert.ok(html.includes(`name="afrotools-content-id" content="${row.contentId}"`), `${row.file} stable content id`);
}

function assertListing(file, locale, prefix) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  assert.ok(html.includes(`name="content-language" content="${locale}"`), `${file} explicit locale metadata`);
  const cards = [...html.matchAll(/<article\b[^>]*class=["'][^"']*article-card[^"']*["'][^>]*>[\s\S]*?<\/article>/gi)];
  assert.ok(cards.length > 0, `${file} article cards`);
  for (const card of cards) {
    assert.ok(new RegExp(`data-locale=["']${locale}["']`, 'i').test(card[0]), `${file} card locale`);
    const link = card[0].match(new RegExp(`href=["']${prefix.replace(/\//g, '\\/')}([^/"'#?]+)\\/?["']`, 'i'));
    if (!link) continue;
    const source = `${prefix.slice(1)}${link[1]}/index.html`;
    assert.strictEqual(byFile.get(source)?.locale, locale, `${file} must not mix ${source}`);
  }
}

assertListing('blog/index.html', 'en', '/blog/');
assertListing('fr/blog/index.html', 'fr', '/fr/blog/');

const feed = fs.readFileSync(path.join(ROOT, 'blog/feed.xml'), 'utf8');
const items = [...feed.matchAll(/<item>[\s\S]*?<\/item>/g)];
assert.ok(items.length > 0);
for (const item of items) {
  assert.ok(item[0].includes('<dc:language>en</dc:language>'));
  assert.ok(!item[0].includes('https://afrotools.com/fr/blog/'));
}

console.log(`Blog locale manifest tests passed (${manifest.articles.length} sources, ${items.length} feed items).`);
