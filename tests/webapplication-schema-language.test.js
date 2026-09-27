'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  extractVisibleFaq,
  pageLanguage,
  parseJsonLd,
  shouldAddWebApplication,
  webApplicationSchema,
} = require('../scripts/add-webapplication-schema');

function blocksFor(schema) {
  return parseJsonLd(`<script type="application/ld+json">${JSON.stringify(schema)}</script>`);
}

test('WebApplication schema follows the document language', () => {
  const html = `<!doctype html>
<html lang="fr-FR">
<head>
  <title>Calculateur de marge | AfroTools</title>
  <meta name="description" content="Calculez une marge locale.">
  <link rel="canonical" href="https://afrotools.com/fr/tools/marge/">
</head>
<body></body>
</html>`;
  const schema = webApplicationSchema('fr/tools/marge/index.html', html);

  assert.equal(pageLanguage(html), 'fr-FR');
  assert.equal(schema.inLanguage, 'fr-FR');
  assert.equal(schema.url, 'https://afrotools.com/fr/tools/marge/');
});

test('WebApplication schema defaults safely to English for an invalid document locale', () => {
  const html = '<html lang="https://afrotools.com/fr/"><head><title>Tool</title><meta name="description" content="Tool description."></head></html>';
  assert.equal(pageLanguage(html), 'en');
});

test('FAQ schema ignores interactive help while keeping visible questions', () => {
  const html = `<main>
    <details data-structured-data-exclude><summary>Need help choosing a PDF action?</summary>
      <form><label>What do you want to do?</label><input></form>
    </details>
    <section><details><summary>Do PDF tools upload files?</summary>
      <p>Core PDF actions run in the browser unless a tool explains a server feature.</p>
    </details></section>
  </main>`;
  assert.deepEqual(extractVisibleFaq(html), [{
    question: 'Do PDF tools upload files?',
    answer: 'Core PDF actions run in the browser unless a tool explains a server feature.',
  }]);
});

test('editorial structured data is not recast as a WebApplication', () => {
  for (const type of ['NewsArticle', 'Article', 'BlogPosting', 'CollectionPage']) {
    assert.equal(shouldAddWebApplication(blocksFor({ '@type': type })), false, type);
  }
  assert.equal(shouldAddWebApplication(blocksFor({ '@type': 'WebApplication' })), false);
  assert.equal(shouldAddWebApplication(blocksFor({ '@type': 'FAQPage' })), true);
});
