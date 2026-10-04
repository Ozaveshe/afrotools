'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { getMetaContent, applyFallbacks } = require('../scripts/apply-og-fallbacks');

const ROOT = path.resolve(__dirname, '..');
const page = path.join(ROOT, 'fr/developers/index.html');
const imageUrl = 'https://afrotools.com/assets/img/og-fr-developers.png';

test('French developer social metadata describes its resources instead of a country tax calculator', () => {
  const html = fs.readFileSync(page, 'utf8');
  assert.equal(getMetaContent(html, 'property', 'og:image'), imageUrl);
  assert.equal(getMetaContent(html, 'name', 'twitter:image'), imageUrl);
  assert.equal(getMetaContent(html, 'property', 'og:image:type'), 'image/png');
  assert.equal(getMetaContent(html, 'property', 'og:image:width'), '1200');
  assert.equal(getMetaContent(html, 'property', 'og:image:height'), '630');
  assert.equal(getMetaContent(html, 'name', 'twitter:card'), 'summary_large_image');
  assert.equal(getMetaContent(html, 'property', 'og:url'), 'https://afrotools.com/fr/developers/');
  assert.equal(getMetaContent(html, 'name', 'twitter:title'), getMetaContent(html, 'property', 'og:title'));
  assert.equal(getMetaContent(html, 'name', 'twitter:description'), getMetaContent(html, 'name', 'description'));
  assert.equal(getMetaContent(html, 'name', 'twitter:image:alt'), getMetaContent(html, 'property', 'og:image:alt'));
  assert.match(getMetaContent(html, 'property', 'og:image:alt'), /développeurs.*API.*widgets/);
});

test('French developer card is a real PNG reproducible from the fixed licensed fonts', () => {
  const { OUTPUT, renderPng } = require('../scripts/build-french-developer-social-card');
  const png = fs.readFileSync(path.join(ROOT, OUTPUT));
  assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
  assert.equal(png.readUInt32BE(16), 1200);
  assert.equal(png.readUInt32BE(20), 630);
  assert(png.equals(renderPng()), 'Committed PNG differs from its source renderer');
  assert(png.equals(renderPng()), 'Repeated generation changed the PNG bytes');
});

test('shared social metadata owner preserves the reviewed developer card and French identity', () => {
  const html = fs.readFileSync(page, 'utf8');
  const once = applyFallbacks(html, page);
  assert.equal(getMetaContent(once.html, 'property', 'og:image'), imageUrl);
  assert.equal(getMetaContent(once.html, 'name', 'twitter:image'), imageUrl);
  assert.equal(applyFallbacks(once.html, page).html, once.html);
  assert.equal(once.html.slice(once.html.indexOf('<body')), html.slice(html.indexOf('<body')));
});
