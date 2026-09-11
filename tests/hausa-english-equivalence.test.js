'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { routeMetadata } = require('../scripts/report-hausa-launch-readiness');
const html = '<html lang="ha"><head><meta name="content-language" content="ha"><title>Hausa</title>'
  + '<meta name="description" content="Bayani"><link rel="canonical" href="https://afrotools.com/ha/example/">'
  + '<link rel="alternate" hreflang="ha" href="https://afrotools.com/ha/example/">'
  + '<script type="application/ld+json">{"inLanguage":"ha"}</script></head><body><h1>Hausa</h1></body></html>';
const englishGaps = (page, target) => routeMetadata('/ha/example/', page, target).gaps.filter(gap => gap.includes('en-hreflang'));
test('Hausa-only equivalence group does not require an English alternate', () => {
  assert.deepEqual(englishGaps(html, null), []);
});
test('an English equivalent still requires the exact alternate and reciprocal link', () => {
  assert.deepEqual(englishGaps(html, '/example/'), ['en-hreflang', 'reciprocal-en-hreflang']);
  const wrong = html.replace('</head>', '<link rel="alternate" hreflang="en" href="https://afrotools.com/wrong/"></head>');
  assert.ok(englishGaps(wrong, '/example/').includes('en-hreflang'));
});
test('a removed English equivalent cannot remain advertised', () => {
  const stale = html.replace('</head>', '<link rel="alternate" hreflang="en" href="https://afrotools.com/example/"></head>');
  assert.deepEqual(englishGaps(stale, null), ['unexpected-en-hreflang']);
});
test('extensionless English file routes retain reciprocal Hausa metadata', () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const route = '/ha/najeriya/harajin-albashi/';
  const page = fs.readFileSync(path.join(__dirname, '../ha/najeriya/harajin-albashi/index.html'), 'utf8');
  const metadata = routeMetadata(route, page, '/nigeria/ng-salary-tax');
  assert.equal(metadata.reciprocal, true);
  assert.equal(metadata.gaps.some(gap => gap.includes('en-hreflang')), false);
});
