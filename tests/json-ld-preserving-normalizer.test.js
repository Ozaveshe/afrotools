'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { normalizeJsonLdStringValues } = require('../scripts/lib/json-ld-preserving-normalizer');

test('updates JSON-LD URL strings without collapsing localized formatting', () => {
  const source = `{
  "@context": "https://schema.org",
  "@type": "WebApplication",
  "name": "Calculateur d'énergie",
  "url": "https://afrotools.com/fr/tools/exemple/index/",
  "potentialAction": {
    "urlTemplate": "https://afrotools.com/fr/recherche/?q={search_term_string}"
  }
}`;

  const result = normalizeJsonLdStringValues(source, (value) => (
    value === 'https://afrotools.com/fr/tools/exemple/index/'
      ? 'https://afrotools.com/fr/tools/exemple/'
      : value
  ));

  assert.equal(result.valuesChanged, 1);
  assert.equal(result.content.split('\n').length, source.split('\n').length);
  assert.match(result.content, /"name": "Calculateur d'énergie"/);
  assert.match(result.content, /"url": "https:\/\/afrotools\.com\/fr\/tools\/exemple\/"/);
  assert.match(result.content, /\{search_term_string\}/);
  assert.doesNotThrow(() => JSON.parse(result.content));
});

test('returns byte-identical JSON-LD when no string needs normalization', () => {
  const source = '{\r\n  "url": "https://afrotools.com/tools/example/"\r\n}\r\n';
  const result = normalizeJsonLdStringValues(source, (value) => value);

  assert.equal(result.valuesChanged, 0);
  assert.equal(result.content, source);
});
