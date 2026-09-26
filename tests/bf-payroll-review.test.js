'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { TARGETS, transform } = require('../scripts/build-bf-payroll-review');
const registry = require('../data/source-registry.json');
const source = registry.sources.find(item => item.id === 'paye-bf-source');
for (const [lang, file] of Object.entries(TARGETS)) {
  const html = fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  assert.equal(transform(html, lang, source), html, lang + ' gate owner must be idempotent');
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
