"use strict";
const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const { applyFallbacks, getMetaContent } = require('../scripts/apply-og-fallbacks');
const { audit, metadata } = require('../scripts/audit-social-metadata');
const page = path.join(__dirname, '..', 'cookies', 'index.html');
const base = '<!doctype html><html lang="en"><head><title>Kenya\'s fees &amp; forms | AfroTools</title><meta name="description" content="Check Kenya\'s forms &amp; costs."><link rel="canonical" href="https://afrotools.com/cookies/"></head><body><h1>Forms</h1></body></html>';
test('public pages without registry artwork get complete OG and Twitter cards', () => {
  const result = applyFallbacks(base, page);
  assert.equal(result.changed, true);
  assert.equal(getMetaContent(result.html, 'property', 'og:title'), "Kenya's fees & forms | AfroTools");
  assert.equal(getMetaContent(result.html, 'property', 'og:description'), "Check Kenya's forms & costs.");
  assert.equal(getMetaContent(result.html, 'property', 'og:url'), 'https://afrotools.com/cookies/');
  assert.equal(getMetaContent(result.html, 'name', 'twitter:card'), 'summary_large_image');
  assert.equal(getMetaContent(result.html, 'name', 'twitter:image'), getMetaContent(result.html, 'property', 'og:image'));
  assert.equal(result.html.slice(result.html.indexOf('<body>')), base.slice(base.indexOf('<body>')));
  assert.equal(applyFallbacks(result.html, page).html, result.html);
});
test('existing editorial artwork and existing card choices are preserved', () => {
  const input = base.replace('</head>', '<meta property="og:image" content="https://afrotools.com/assets/img/kitchen/jollof-rice.webp"><meta name="twitter:card" content="summary"></head>');
  const result = applyFallbacks(input, page);
  assert.equal(getMetaContent(result.html, 'property', 'og:image'), 'https://afrotools.com/assets/img/kitchen/jollof-rice.webp');
  assert.equal(getMetaContent(result.html, 'name', 'twitter:image'), 'https://afrotools.com/assets/img/kitchen/jollof-rice.webp');
  assert.equal(getMetaContent(result.html, 'name', 'twitter:card'), 'summary');
});
test('utility noindex pages and redirects are not promoted into social pages', () => {
  const noindex = base.replace('</head>', '<meta name="robots" content="noindex, follow"></head>');
  assert.equal(applyFallbacks(noindex, page).html, noindex);
  const redirect = base.replace('</head>', '<meta http-equiv="refresh" content="0; url=/privacy/"></head>');
  assert.equal(applyFallbacks(redirect, page).html, redirect);
});
test('attribute quote boundaries retain apostrophes and decode entities once', () => {
  assert.equal(getMetaContent('<meta name="description" content="Côte d\'Ivoire &amp; costs">', 'name', 'description'), "Côte d'Ivoire & costs");
  assert.equal(getMetaContent("<meta name='description' content='Read &quot;fees&quot; &amp;eacute;'>", 'name', 'description'), 'Read "fees" &eacute;');
});
test('audit inspects every public locale and keeps utility, redirect and fragment scopes separate', () => {
  const make = (locale, state = 'page', indexability = 'indexable') => ({ locale, state, indexability, route: '/' + locale + '/', source: { file: locale } });
  const graph = { routes: ['en', 'fr', 'sw', 'ha', 'yo'].map(locale => make(locale)).concat([make('utility', 'page', 'noindex'), make('alias', 'redirect', 'redirect')]) };
  const report = audit(graph, () => base);
  assert.equal(report.indexablePages, 5);
  assert.equal(report.missingRequired['twitter:card'], 5);
  assert.equal(report.rows.length, 5);
  assert.equal(metadata('<html><body><meta name="twitter:card" content="summary"></body></html>')['twitter:card'], undefined);
  assert.equal(metadata('<head><meta content="Côte d\'Ivoire &amp; fees" property="og:title"></head>')['og:title'], "Côte d'Ivoire & fees");
});
