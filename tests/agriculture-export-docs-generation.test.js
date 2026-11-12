'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const write = fs.writeFileSync;
const mkdir = fs.mkdirSync;
let generator;
try {
  fs.writeFileSync = () => { throw new Error('Import must not rewrite public pages'); };
  fs.mkdirSync = () => { throw new Error('Import must not allocate output directories'); };
  generator = require('../scripts/generate-export-docs-pages');
} finally {
  fs.writeFileSync = write;
  fs.mkdirSync = mkdir;
}
const snippets = require('../scripts/repair-english-search-snippets');
assert.equal(generator.COUNTRIES.length, 54);
assert.equal(new Set(generator.COUNTRIES.map(country => country.code)).size, 54);
for (const country of generator.COUNTRIES) {
  const html = generator.pageHtml(country);
  assert.equal((html.match(/class="seo-content agri-country-facts"/g) || []).length, 1, country.slug + ' retains one farming-context section');
  assert.match(html, /Country context from the AfroTools agriculture dataset/);
  assert.match(html, /<body class="top-level-page-ui-refresh">/);
  assert.equal((html.match(/href="\/assets\/css\/top-level-page-ui-refresh\.css"/g) || []).length, 1);
  assert.match(html, /<button type="button"[^>]*id="edBtnGenerate"/);
  assert.match(html, /\/engines\/agriculture-export-docs-controller\.js/);
  assert.doesNotMatch(html, /\/engines\/export-docs-engine\.js/);
  assert.equal(snippets.apply(html, snippets.metadataFor(country.slug)), html, country.slug + ' metadata owner is already satisfied');
  assert.equal(html, generator.pageHtml(country), country.slug + ' generation is deterministic');
}
console.log('All54 Export Docs pages retain farming context, shared UI and explicit button behavior; imports are read-only.');
