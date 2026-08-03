'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'blog-content-explosion-2026-08.json'), 'utf8'));

assert.strictEqual(data.articles.length, 20, 'content explosion wave must contain exactly 20 articles');
assert.strictEqual(new Set(data.articles.map(article => article.slug)).size, 20, 'article slugs must be unique');
assert.strictEqual(new Set(data.articles.map(article => article.keyword.toLowerCase())).size, 20, 'primary keywords must be unique');

for (const article of data.articles) {
  const file = path.join(root, 'blog', article.slug, 'index.html');
  assert.ok(fs.existsSync(file), `${article.slug}: generated article is missing`);
  const html = fs.readFileSync(file, 'utf8');
  const bodyMatch = html.match(/<article class="article-body">([\s\S]*?)<\/article>/);
  assert.ok(bodyMatch, `${article.slug}: article body is missing`);
  const text = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  assert.ok(words >= 1100, `${article.slug}: ${words} words is below the 1,100-word editorial floor`);
  assert.ok(article.title.length <= 65, `${article.slug}: title is longer than 65 characters`);
  assert.ok(article.description.length >= 120 && article.description.length <= 160, `${article.slug}: description must be 120-160 characters`);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com/blog/${article.slug}/">`), `${article.slug}: canonical mismatch`);
  assert.ok(html.includes(article.tool[0]), `${article.slug}: primary tool link missing`);
  assert.ok(article.related.every(([href]) => html.includes(href)), `${article.slug}: related article link missing`);
  assert.ok(article.sources.length >= 3 && article.sources.every(([href]) => html.includes(href)), `${article.slug}: source coverage missing`);
  assert.ok(html.includes('Official sources reviewed:</strong> <strong>August 2, 2026'), `${article.slug}: review date missing`);
  assert.ok(html.includes('"@type":"FAQPage"'), `${article.slug}: FAQ schema missing`);
  assert.ok(!html.includes('—'), `${article.slug}: publishable copy contains an em dash`);
}

const hub = fs.readFileSync(path.join(root, 'blog', 'index.html'), 'utf8');
for (const article of data.articles) assert.ok(hub.includes(`/blog/${article.slug}/`), `${article.slug}: hub card missing`);

console.log('blog content explosion: 20 articles passed quality, metadata, source and linking checks');
