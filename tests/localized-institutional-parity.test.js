'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const ROUTES = {
  fr: ['fr/index.html','fr/about/index.html','fr/contact/index.html','fr/faq/index.html','fr/cookies/index.html','fr/privacy/index.html','fr/terms-of-use/index.html'],
  sw: ['sw/index.html','sw/kuhusu/index.html','sw/wasiliana/index.html','sw/maswali-ya-mara-kwa-mara/index.html','sw/vidakuzi/index.html','sw/faragha/index.html','sw/masharti/index.html']
};

function read(rel) { return fs.readFileSync(path.join(ROOT, rel), 'utf8'); }

for (const [locale, files] of Object.entries(ROUTES)) {
  for (const file of files) {
    const html = read(file);
    assert.match(html, new RegExp(`<html\\b[^>]*\\blang=["']${locale}["']`, 'i'), `${file}: locale`);
    assert.match(html, /<meta\b[^>]*\bname=["']viewport["']/i, `${file}: viewport`);
    assert.match(html, /<meta\b[^>]*\bname=["']description["']/i, `${file}: description`);
    assert.match(html, /<meta\b[^>]*\bproperty=["']og:title["']/i, `${file}: Open Graph title`);
    assert.match(html, /<link\b[^>]*\brel=["']canonical["']/i, `${file}: canonical`);
    assert.match(html, /application\/ld\+json/i, `${file}: structured data`);
    assert.strictEqual((html.match(/<h1\b/gi) || []).length, 1, `${file}: one h1`);
    assert.match(html, /<afro-navbar\b/i, `${file}: shared navbar`);
    assert.match(html, /<afro-footer\b/i, `${file}: shared footer`);
  }
}

for (const file of ['fr/index.html','sw/index.html']) {
  const html = read(file);
  assert.ok((html.match(/<form\b/gi) || []).length >= 3, `${file}: three useful discovery forms`);
  assert.ok((html.match(/<(?:input|select|textarea)\b/gi) || []).length >= 6, `${file}: discovery controls`);
  assert.ok((html.match(/<a\b/gi) || []).length >= 90, `${file}: discovery links`);
  assert.match(html, /["']FAQPage["']/i, `${file}: FAQ schema`);
}

for (const file of ['fr/contact/index.html','sw/wasiliana/index.html']) {
  const html = read(file);
  assert.match(html, /data-netlify=["']true["']/i, `${file}: Netlify form owner`);
  for (const name of ['name','email','reason','tool','country','message']) {
    assert.match(html, new RegExp(`name=["']${name}["']`, 'i'), `${file}: ${name} field`);
  }
  assert.match(html, /netlify-honeypot=["']bot-field["']/i, `${file}: honeypot`);
}

for (const file of ['fr/faq/index.html','sw/maswali-ya-mara-kwa-mara/index.html']) {
  const html = read(file);
  assert.ok((html.match(/class=["']li-faq-item["']/gi) || []).length >= 16, `${file}: 16 FAQ answers`);
  assert.match(html, /role=["']search["']/i, `${file}: FAQ filtering`);
  assert.match(html, /aria-live=["']polite["']/i, `${file}: filter status`);
}

for (const file of ['fr/cookies/index.html','sw/vidakuzi/index.html']) {
  assert.match(read(file), /data-afro-cookie-consent-open/i, `${file}: consent preference action`);
}

console.log('Localized French/Swahili Tier-1 institutional parity contract passed (14 pages).');
