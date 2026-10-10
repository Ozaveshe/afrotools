'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { applyTitleMetadata } = require('../scripts/lib/page-title-metadata');

test('title-only generation preserves current artwork, body, scripts and other metadata', () => {
  const before = '<head><title>Old</title><meta property="og:title" content="Old"><meta name="twitter:title" content="Old"><meta property="og:image" content="reviewed.webp"><link rel="canonical" href="/unchanged"><script type="application/ld+json">{"name":"Old"}</script></head><body>Current controls<script>calculate(123);</script></body>';
  const generated = '<head><title>New</title><meta property="og:title" content="New"><meta name="twitter:title" content="New"></head><body>Historical controls</body>';
  const after = applyTitleMetadata(before, generated);
  assert.equal(after.replaceAll('New', 'Old'), before);
  assert.equal(applyTitleMetadata(after, generated), after);
});

test('missing or duplicated metadata fails instead of partially rewriting a page', () => {
  const page = '<title>A</title><meta property="og:title" content="A"><meta name="twitter:title" content="A">';
  assert.throws(() => applyTitleMetadata(page + '<title>Duplicate</title>', page), /exactly one/);
  assert.throws(() => applyTitleMetadata(page, '<title>B</title>'), /exactly one/);
});
