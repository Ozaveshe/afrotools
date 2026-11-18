'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { homeLanguageLinks } = require('../scripts/lib/home-language-links');
const { locales } = require('../data/registry/locale-manifest.json');

test('each public homepage has native links to the other public language homepages', () => {
  const publicLocales = locales.filter(locale => ['default', 'launched', 'partial'].includes(locale.launchStatus));
  for (const locale of publicLocales) {
    const filename = path.join(__dirname, '..', locale.routePrefix.slice(1), 'index.html');
    const html = fs.readFileSync(filename, 'utf8');
    const fallback = html.match(/<afro-navbar\b[^>]*>([\s\S]*?)<\/afro-navbar>/)[1];
    assert.equal(fallback, homeLanguageLinks(locale.id));
    for (const target of publicLocales) {
      assert.ok(fallback.includes(`href="${target.routePrefix}/" lang="${target.id}" hreflang="${target.id}"`));
    }
    assert.equal((fallback.match(/aria-current="page"/g) || []).length, 1);
  }
});
