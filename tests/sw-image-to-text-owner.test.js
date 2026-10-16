'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { build } = require('../scripts/build-sw-image-to-text');
const original = fs.readFileSync('tools/image-to-text/index.html', 'utf8');
const studio = /<script\b[^>]*\bsrc=["']\/assets\/js\/lib\/image-to-text-studio\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/g;

test('Swahili OCR adapter follows the source studio independently of its cache key', () => {
  for (const suffix of ['', '?v=a5611fd9', '?v=reviewed-new-owner']) {
    const tag = `<script src="/assets/js/lib/image-to-text-studio.js${suffix}" defer></script>`;
    const html = build(original.replace(studio, tag));
    assert.equal((html.match(studio) || []).length, 1);
    assert.equal((html.match(/src="\/assets\/js\/lib\/image-to-text-studio-sw\.js"/g) || []).length, 1);
    assert.ok(html.includes(tag + '\n<script src="/assets/js/lib/image-to-text-studio-sw.js" defer></script>'));
    assert.match(html, /lang="sw"/);
  }
});

test('Swahili OCR owner fails closed on missing, duplicate or inherited adapter scripts', () => {
  assert.throws(() => build(original.replace(studio, '')), /exactly one English OCR studio/);
  const tag = original.match(studio)[0];
  assert.throws(() => build(original.replace(studio, tag + tag)), /exactly one English OCR studio/);
  assert.throws(() => build(original + '<script src="/assets/js/lib/image-to-text-studio-sw.js" defer></script>'), /no inherited Swahili adapter/);
});
