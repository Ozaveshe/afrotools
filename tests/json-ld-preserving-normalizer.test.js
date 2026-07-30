'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const {
  canonicalSchemaLanguage,
  normalizeJsonLdLanguageValues,
  normalizeJsonLdStringValues,
} = require('../scripts/lib/json-ld-preserving-normalizer');

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

test('repairs malformed French inLanguage values without treating them as URLs', () => {
  for (const invalid of ['https://afrotools.com/fr/', 'fr,en', ['fr', 'en']]) {
    const source = `{\n  "@context": "https://schema.org",\n  "@type": "WebApplication",\n  "inLanguage": ${JSON.stringify(invalid)},\n  "name": "Calculateur"\n}`;
    const result = normalizeJsonLdLanguageValues(source, 'fr');

    assert.equal(result.valuesChanged, 1);
    assert.equal(result.valuesAdded, 0);
    assert.equal(JSON.parse(result.content).inLanguage, 'fr');
    assert.equal(result.content.split('\n').length, source.split('\n').length);
  }
});

test('accepts fr and fr-FR as valid French schema languages', () => {
  for (const accepted of ['fr', 'fr-FR']) {
    const source = `{"@type":"WebApplication","inLanguage":${JSON.stringify(accepted)}}`;
    const result = normalizeJsonLdLanguageValues(source, 'fr');

    assert.equal(result.valuesChanged, 0);
    assert.equal(result.valuesAdded, 0);
    assert.equal(result.content, source);
  }
});

test('adds missing inLanguage to a root content schema while preserving layout', () => {
  const source = `{\n  "@context": "https://schema.org",\n  "@type": "WebApplication",\n  "name": "Calculateur"\n}`;
  const result = normalizeJsonLdLanguageValues(source, 'fr-FR');

  assert.equal(result.valuesChanged, 0);
  assert.equal(result.valuesAdded, 1);
  assert.equal(JSON.parse(result.content).inLanguage, 'fr-FR');
  assert.match(result.content, /"@type": "WebApplication",\n  "inLanguage": "fr-FR"/);
});

test('does not add inLanguage to structural-only schema', () => {
  const source = '{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[]}';
  const result = normalizeJsonLdLanguageValues(source, 'fr');

  assert.equal(result.valuesChanged, 0);
  assert.equal(result.valuesAdded, 0);
  assert.equal(result.content, source);
});

test('adds missing inLanguage to content owners inside an @graph', () => {
  const source = '{"@context":"https://schema.org","@graph":[{"@type":"Article","headline":"Guide"},{"@type":"BreadcrumbList","itemListElement":[]}]}';
  const result = normalizeJsonLdLanguageValues(source, 'fr');
  const parsed = JSON.parse(result.content);

  assert.equal(result.valuesAdded, 1);
  assert.equal(parsed['@graph'][0].inLanguage, 'fr');
  assert.equal(Object.hasOwn(parsed['@graph'][1], 'inLanguage'), false);
});

test('canonicalizes supported language tags and rejects URL or comma values', () => {
  assert.equal(canonicalSchemaLanguage('FR-fr'), 'fr-FR');
  assert.equal(canonicalSchemaLanguage('en-us'), 'en-US');
  assert.equal(canonicalSchemaLanguage('https://afrotools.com/fr/'), '');
  assert.equal(canonicalSchemaLanguage('fr,en'), '');
  assert.throws(
    () => normalizeJsonLdLanguageValues('{"@type":"WebApplication"}', 'fr,en'),
    /Unsupported schema language/
  );
});
