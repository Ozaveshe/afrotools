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
  {
    const locale = file.split('/')[0];
    const forms = [...html.matchAll(/<form\b[^>]*>[\s\S]*?<\/form>/gi)].map(match => match[0]);
    for (const [className, action, names] of [['fr-home-search','/fr/all-tools/',['q']],['fr-home-country-card','/fr/all-tools/',['country','category']],['fr-home-ai-card','/fr/ai/',['q','source']]]) {
      const localizedClass = className;
      const localizedAction = locale === 'sw' ? action.replace('/fr/all-tools/', '/sw/zana-zote/').replace('/fr/ai/', '/sw/ai/') : action;
      const form = forms.find(value => value.includes(localizedClass));
      assert.ok(form, className + ': discovery form');
      assert.ok(form.includes('action="'+localizedAction+'"') && form.includes('method="get"'), className + ': localized GET handoff');
      for (const name of names) assert.ok(form.includes('name="'+name+'"'), className + ': submitted '+name);
      assert.match(form, /<label\b/, className + ': visible label');
      assert.match(form, /type="submit"/, className + ': submit action');
    }
    assert.doesNotMatch(html, /name="evidence"/, 'homepage must not submit the retired evidence filter');
  }
  assert.ok((html.match(/<a\b/gi) || []).length >= 90, `${file}: discovery links`);
  assert.ok((html.match(/<details\b/gi) || []).length >= 4, `${file}: visible FAQ answers`);
}
assert.doesNotMatch(read('fr/index.html'), /["']FAQPage["']/i, 'fr/index.html: no unsupported FAQ rich-result markup');
assert.match(read('sw/index.html'), /["']FAQPage["']/i, 'sw/index.html: visible FAQ schema');

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
