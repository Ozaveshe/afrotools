'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const data = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'blog-content-explosion-wave2-2026-08.json'), 'utf8'));
const firstWave = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'blog-content-explosion-2026-08.json'), 'utf8'));
const registry = fs.readFileSync(path.join(root, 'assets', 'js', 'components', 'tool-registry.js'), 'utf8');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data', 'content', 'blog-article-manifest.json'), 'utf8'));
const hub = fs.readFileSync(path.join(root, 'blog', 'index.html'), 'utf8');
const report = fs.readFileSync(path.join(root, 'reports', 'blog-seo-opportunities-wave2-2026-08.md'), 'utf8');

assert.strictEqual(data.articles.length, 30, 'wave two must contain exactly 30 articles');
assert.match(data.method.scoreType, /qualitative/i, 'keyword score must be labelled qualitative');
assert.match(data.method.dataGap, /No sanitised Search Console/i, 'keyword data limitation must remain explicit');
assert.strictEqual(new Set(data.articles.map(article => article.slug)).size, 30, 'wave-two slugs must be unique');
assert.strictEqual(new Set(data.articles.map(article => article.keyword.toLowerCase())).size, 30, 'wave-two primary keywords must be unique');

const firstWaveSlugs = new Set(firstWave.articles.map(article => article.slug));
const firstWaveKeywords = new Set(firstWave.articles.map(article => article.keyword.toLowerCase()));
for (const article of data.articles) {
  assert.ok(!firstWaveSlugs.has(article.slug), `${article.slug}: duplicates a first-wave slug`);
  assert.ok(!firstWaveKeywords.has(article.keyword.toLowerCase()), `${article.slug}: duplicates a first-wave keyword`);
}

const clusterCounts = data.articles.reduce((counts, article) => {
  counts[article.cluster] = (counts[article.cluster] || 0) + 1;
  return counts;
}, {});
assert.deepStrictEqual(clusterCounts, { business: 5, agriculture: 5, construction: 5, logistics: 5, events: 5, government: 5 }, 'wave two must keep five distinct jobs in each cluster');

for (const article of data.articles) {
  const file = path.join(root, 'blog', article.slug, 'index.html');
  assert.ok(fs.existsSync(file), `${article.slug}: generated article is missing`);
  const html = fs.readFileSync(file, 'utf8');
  const bodyMatch = html.match(/<article class="article-body">([\s\S]*?)<\/article>/);
  assert.ok(bodyMatch, `${article.slug}: article body is missing`);
  const text = bodyMatch[1].replace(/<[^>]+>/g, ' ').replace(/&[a-z0-9#]+;/gi, ' ').replace(/\s+/g, ' ').trim();
  const words = text.split(' ').filter(Boolean).length;
  assert.ok(words >= 1400, `${article.slug}: ${words} words is below the 1,400-word editorial floor`);
  assert.ok(article.title.length <= 60, `${article.slug}: title is longer than 60 characters`);
  assert.ok(article.description.length >= 120 && article.description.length <= 160, `${article.slug}: description must be 120-160 characters`);
  assert.ok(article.opportunityScore >= 75 && article.opportunityScore <= 100, `${article.slug}: opportunity score is outside the qualitative scale`);
  assert.ok(['high', 'medium-high'].includes(article.opportunityConfidence), `${article.slug}: opportunity confidence is missing`);
  assert.match(article.cannibalization, /low/i, `${article.slug}: cannibalisation guard is missing`);
  assert.strictEqual((html.match(/<h1>/g) || []).length, 1, `${article.slug}: article must contain one H1`);
  assert.ok(html.includes(`<h1>${article.title.replace(/&/g, '&amp;')}</h1>`), `${article.slug}: H1 does not match the brief`);
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com/blog/${article.slug}/">`), `${article.slug}: canonical mismatch`);
  assert.ok(html.includes(article.tool[0]), `${article.slug}: primary tool link missing`);
  assert.ok(registry.includes(`href: '${article.tool[0]}'`), `${article.slug}: tool handoff is not present in the registry`);
  assert.ok(fs.existsSync(path.join(root, 'assets', 'img', 'tools', `${article.image}.webp`)), `${article.slug}: social image is missing`);
  assert.ok(article.related.length >= 2 && article.related.length <= 4, `${article.slug}: expected 2-4 internal related links`);
  assert.ok(article.related.every(([href]) => html.includes(href)), `${article.slug}: related link missing from output`);
  assert.ok(article.sources.length >= 3 && article.sources.every(([href]) => href.startsWith('https://') && html.includes(href)), `${article.slug}: source coverage missing`);
  assert.ok(html.includes('Sources reviewed:</strong> <strong>August 3, 2026'), `${article.slug}: source-review date missing`);
  assert.ok(html.includes('"@type":"Article"'), `${article.slug}: Article schema missing`);
  assert.ok(html.includes('"@type":"BreadcrumbList"'), `${article.slug}: breadcrumb schema missing`);
  assert.ok(html.includes('"@type":"FAQPage"'), `${article.slug}: FAQ schema missing`);
  assert.ok((html.match(/class="faq-item"/g) || []).length >= 5, `${article.slug}: fewer than five FAQs`);
  assert.ok(!/[—�]/.test(html), `${article.slug}: publishable copy contains an em dash or replacement character`);
  assert.ok(!/â(?:€|€™|€œ|€˜)/.test(html), `${article.slug}: publishable copy contains mojibake`);
  assert.ok(!/game[- ]changing|revolutionary|in today's fast-paced/i.test(text), `${article.slug}: copy contains an avoidable marketing cliche`);
  assert.ok(hub.includes(`/blog/${article.slug}/`), `${article.slug}: blog hub card missing`);
  assert.ok(manifest.articles.some(row => row.file === `blog/${article.slug}/index.html` && row.publicationStatus === 'published'), `${article.slug}: manifest record missing`);
  assert.ok(report.includes(`| ${article.keyword} |`), `${article.slug}: opportunity report row missing`);
}

console.log('blog content explosion wave two: 30 articles passed editorial, SEO, source, tool, image, manifest and hub checks');
