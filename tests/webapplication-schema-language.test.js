'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  pageLanguage,
  webApplicationSchema,
} = require('../scripts/add-webapplication-schema');

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
