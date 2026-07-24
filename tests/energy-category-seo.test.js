'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'energy', 'index.html'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'assets', 'js', 'components', 'tool-registry.js'), 'utf8');

function matchOne(pattern, label) {
  const match = html.match(pattern);
  assert.ok(match, `Missing ${label}`);
  return match[1];
}

const title = matchOne(/<title>([^<]+)<\/title>/, 'page title');
const description = matchOne(/<meta name="description" content="([^"]+)">/, 'meta description');
assert.ok(title.length >= 45 && title.length <= 70, `Title length should be 45-70 characters, got ${title.length}`);
assert.ok(description.length >= 120 && description.length <= 165, `Description length should be 120-165 characters, got ${description.length}`);
assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/energy\/">/);
assert.match(html, /<meta property="og:image:alt" content="[^"]+">/);
assert.match(html, /<meta name="twitter:image:alt" content="[^"]+">/);
assert.match(html, /<nav class="en-breadcrumb" aria-label="Breadcrumb">/);
assert.match(html, /<a href="\/">Home<\/a>.*aria-current="page">Energy &amp; Utilities<\/span>/);

const jsonLdBlocks = Array.from(html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g), (match) => JSON.parse(match[1]));
const entities = jsonLdBlocks.flatMap((block) => block['@graph'] || [block]);
const collection = entities.find((entity) => entity['@type'] === 'CollectionPage');
const itemList = entities.find((entity) => entity['@type'] === 'ItemList');
assert.ok(collection, 'CollectionPage schema is required for the category hub');
assert.ok(itemList, 'ItemList schema is required for the visible catalog');
assert.equal(collection.mainEntity['@id'], itemList['@id']);
assert.equal(collection.dateModified, '2026-07-14');
assert.equal(itemList.numberOfItems, 20);
assert.equal(itemList.itemListElement.length, 20);
assert.deepEqual(itemList.itemListElement.map((item) => item.position), Array.from({ length: 20 }, (_, index) => index + 1));
const faq = entities.find((entity) => entity['@type'] === 'FAQPage');
assert.ok(faq, 'FAQ schema should describe the visible Energy questions');
assert.equal(faq.mainEntity.length, 6);
for (const question of faq.mainEntity) {
  assert.ok(html.includes(question.name), `FAQ schema question must be visible: ${question.name}`);
}

const hubRoutes = Array.from(html.matchAll(/<a href="(\/tools\/[^"]+\/)" class="en-tool-card"/g), (match) => match[1]);
const schemaRoutes = itemList.itemListElement.map((item) => new URL(item.url).pathname);
assert.equal(hubRoutes.length, 20);
assert.deepEqual(schemaRoutes, hubRoutes, 'ItemList order and URLs must match the visible 20-card catalog');

for (const staleClaim of [
  'using current tariff rates',
  'official tariff rates',
  'WHO benchmarks',
  'local provider info',
  '25-year return on investment',
  'Find offset costs',
  '0.28 litres per kWh',
  '18–36 months'
]) {
  assert.equal(html.includes(staleClaim), false, `Removed unsupported hub claim returned: ${staleClaim}`);
}

for (const staleRegistryClaim of ['M-KOPA, d.light, Zola', 'lost itemivity', 'fuel risk, carbon credits']) {
  assert.equal(registry.includes(staleRegistryClaim), false, `Removed registry claim returned: ${staleRegistryClaim}`);
}

for (const item of itemList.itemListElement) {
  const slug = new URL(item.url).pathname.split('/').filter(Boolean).pop();
  assert.ok(fs.existsSync(path.join(root, 'assets', 'img', 'tools', `${slug}.webp`)), `Missing canonical image for ${slug}`);
}

assert.ok(fs.existsSync(path.join(root, 'reports', 'energy-deep-improvement-image-needs.md')));
console.log('Energy category SEO verified: focused metadata, visible breadcrumb, CollectionPage + 20-item catalog schema, honest claims, registry parity, and complete app-image coverage.');
