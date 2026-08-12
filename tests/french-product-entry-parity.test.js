const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

function read(file) {
  return fs.readFileSync(path.join(root, file), 'utf8');
}

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

function visibleWords(html) {
  const body = (html.match(/<body\b[^>]*>([\s\S]*?)<\/body>/i) || [null, html])[1];
  const text = body
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&(?:#\d+|#x[\da-f]+|\w+);/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.split(/\s+/).length : 0;
}

function metrics(file) {
  const html = read(file);
  return {
    html,
    words: visibleWords(html),
    headings: count(html, /<h[23]\b/gi),
    links: count(html, /<a\b/gi),
    buttons: count(html, /<button\b/gi),
    inputs: count(html, /<(?:input|textarea|select)\b/gi),
    schemas: [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)].map((match) => JSON.parse(match[1]))
  };
}

const englishPro = metrics('pro/index.html');
const frenchPro = metrics('fr/pro/index.html');
assert.match(frenchPro.html, /<html\b[^>]*lang="fr"/i, 'French Pro document language');
assert.match(frenchPro.html, /afrotools-source-owner" content="hand-authored:fr\/pro\/index\.html"/, 'French Pro source owner');
assert.match(frenchPro.html, /afrotools-content-id" content="fr-surface:fr-pro"/, 'French Pro stable content id');
assert.ok(frenchPro.words / englishPro.words >= 0.65, 'French Pro visible-content parity');
assert.ok(frenchPro.headings / englishPro.headings >= 0.6, 'French Pro section parity');
assert.ok(frenchPro.links / englishPro.links >= 0.5, 'French Pro discovery parity');
assert.ok(frenchPro.inputs >= englishPro.inputs, 'French Pro pricing control parity');
assert.ok(frenchPro.buttons > 0, 'French Pro interactive actions');
assert.ok(frenchPro.schemas.some((schema) => schema['@type'] === 'SoftwareApplication'), 'French Pro product schema');
assert.ok(frenchPro.schemas.some((schema) => schema['@type'] === 'FAQPage'), 'French Pro FAQ schema');
assert.match(frenchPro.html, /id="currency-select-fr"/, 'French Pro currency selector');
assert.match(frenchPro.html, /AfroProPlan\.getPlanFor/, 'French Pro uses the shared price registry');
assert.match(frenchPro.html, /aria-expanded="false"/, 'French Pro FAQ disclosure state');

const englishBusiness = metrics('business-roi/index.html');
const frenchBusiness = metrics('fr/business-roi/index.html');
assert.match(frenchBusiness.html, /afrotools-source-owner" content="hand-authored:fr\/business-roi\/index\.html"/, 'French Business ROI source owner');
assert.match(frenchBusiness.html, /afrotools-content-id" content="fr-surface:fr-business-roi"/, 'French Business ROI stable content id');
assert.ok(frenchBusiness.links / englishBusiness.links >= 0.5, 'French Business ROI discovery parity');
for (const route of ['/fr/vat-business-tax/', '/fr/salary-tax/', '/fr/trade/', '/fr/document-pdf/', '/fr/small-business/', '/fr/blog/']) {
  assert.ok(frenchBusiness.html.includes(`href="${route}"`), `French Business ROI links to ${route}`);
}

console.log('French Pro and Business ROI product-entry parity passed.');
