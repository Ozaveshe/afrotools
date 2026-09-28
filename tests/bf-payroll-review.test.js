'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { TARGETS, COPY, metadataFor, transform } = require('../scripts/build-bf-payroll-review');
const registry = require('../data/source-registry.json');
const { dedupeRepeatedParagraphs } = require('../scripts/lib/content-integrity');
const { repairHtml } = require('../scripts/repair-french-navigation-links');
const snippets = require('../scripts/repair-swahili-search-snippets');
const { extractMetadata } = require('../scripts/audit-search-snippets');
const source = registry.sources.find(item => item.id === 'paye-bf-source');
for (const [lang, file] of Object.entries(TARGETS)) {
  const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.equal(transform(html, lang, source), html, lang + ' gate owner must be idempotent');
  const metadata = metadataFor(lang);
  assert.equal(extractMetadata(html).title, metadata.title);
  assert.equal(extractMetadata(html).description, metadata.description);
  assert.ok(metadata.title.length <= 65, lang + ' concise title');
  assert.ok(metadata.description.length >= 70 && metadata.description.length <= 180, lang + ' concise description');
  for (const [name, value] of [['og:title', metadata.title], ['twitter:title', metadata.title], ['og:description', metadata.description], ['twitter:description', metadata.description]]) {
    const tag = [...html.matchAll(/<meta\b[^>]*>/g)].find(match => match[0].includes('="' + name + '"'))?.[0];
    assert.ok(tag && tag.includes('content="' + value + '"'), lang + ' social ' + name);
  }
  for (const field of ['reason', 'scope', 'inputs', 'recovery']) {
    assert.equal([...html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '').matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].filter(block => block[1] === COPY[lang][field]).length, 1, lang + ' visible ' + field + ' must occur exactly once');
  }
  const deduped = dedupeRepeatedParagraphs(html);
  assert.equal(deduped.count, 0, lang + ' must not recreate paragraphs removed by release normalization');
  let released = deduped.html;
  if (lang === 'fr') released = repairHtml(released).next;
  if (lang === 'sw') {
    const snippetMetadata = snippets.metadataFor('burkina-faso', 'kikokotoo-kodi-mshahara');
    assert.deepEqual(snippetMetadata, metadata);
    released = snippets.apply(released, snippetMetadata);
    assert.equal(transform(snippets.apply(html, snippetMetadata), lang, source), html, 'SW snippet-then-gate order');
  }
  assert.equal(released, html, lang + ' release normalization must retain the exact owner output');
  assert.equal(transform(released, lang, source), released, lang + ' owner must retain release normalization');
  assert.equal((html.match(/id="bf-payroll-review"/g) || []).length, 1);
  for (const match of html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    if (/function\s|RESULT|calculate\(|PAYE_SAVE_SLUG/.test(match[2]) && !/application\/json/.test(match[1])) assert.match(match[1], /type="application\/x-bf-review-required"/, lang + ' legacy controller must not execute');
    if (/net-to-gross|french-finance-export-contract|sw-paye-local-export/.test(match[1])) assert.match(match[1], /type="application\/x-bf-review-required"/);
  }
  assert.ok(html.includes('data-bf-source-id="paye-bf-source"'));
  assert.ok(html.includes('datetime="' + source.lastReviewedAt + '"'));
  assert.ok(html.includes('hreflang="en"') && html.includes('hreflang="fr"') && html.includes('hreflang="sw"'));
}
console.log('BF review: all three static gates, inactive legacy output paths and historical source dates PASS');
