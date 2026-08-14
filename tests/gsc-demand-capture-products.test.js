const assert = require('assert');
const fs = require('fs');
const path = require('path');
const authorityEngine = require('../assets/js/engines/paye-authority-router-engine.js');
const authorityData = require('../data/salary-tax/authority-router.json');

const root = path.resolve(__dirname, '..');
function read(relative) { return fs.readFileSync(path.join(root, relative), 'utf8'); }

assert.equal(authorityEngine.validateDataset(authorityData).valid, true);
assert.equal(authorityEngine.resolve(authorityData.authorities, { query: 'MRA' }).status, 'ambiguous');
assert.equal(authorityEngine.resolve(authorityData.authorities, { query: 'MRA', countryCode: 'MW' }).match.id, 'mra-malawi');
assert.equal(authorityEngine.resolve(authorityData.authorities, { query: 'ERS' }).match.calculator_url, '/eswatini/sz-paye');
assert.equal(authorityEngine.resolve(authorityData.authorities, { query: 'unknown authority' }).status, 'unsupported');
assert.equal(new Set(authorityData.authorities.map((item) => item.id)).size, authorityData.authorities.length);

const fuelHtml = read('tools/fuel-tracker/index.html');
const fuelJs = read('assets/js/pages/fuel-tracker-vip.js');
const authorityHtml = read('tools/paye-authority-finder/index.html');
const authorityJs = read('assets/js/pages/paye-authority-finder.js');
const frenchAuthorityHtml = read('fr/tools/trouver-administration-paye/index.html');

for (const [name, html, canonical] of [
  ['fuel', fuelHtml, 'https://afrotools.com/tools/fuel-tracker/'],
  ['authority', authorityHtml, 'https://afrotools.com/tools/paye-authority-finder/']
]) {
  assert.equal((html.match(/<title>/g) || []).length, 1, name + ' unique title');
  assert.equal((html.match(/<meta name="description"/g) || []).length, 1, name + ' unique description');
  assert.equal((html.match(/<h1>/g) || []).length, 1, name + ' unique H1');
  assert(html.includes('<link rel="canonical" href="' + canonical + '">'), name + ' canonical');
  assert(html.includes('hreflang="x-default"'), name + ' x-default hreflang');
  const blocks = [...html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)];
  assert(blocks.length > 0, name + ' JSON-LD exists');
  blocks.forEach((block) => JSON.parse(block[1]));
  assert(!/[?&](?:market|country|authority|provider)=/i.test(canonical), name + ' has no indexable parameter state');
}

assert(fuelHtml.includes('id="fuel-use-location"'), 'location action exists');
assert(fuelHtml.includes('aria-live="polite"'), 'fuel live status exists');
assert(authorityHtml.includes('aria-live="polite"'), 'authority live status exists');
assert(!/localStorage|sessionStorage/.test(fuelJs), 'fuel runtime does not persist location or selection');
assert(!/console\.(?:log|info|warn|error)/.test(fuelJs), 'fuel runtime does not log coordinates');
assert(!/latitude|longitude|coords/.test(fuelJs.match(/function safeEvent[\s\S]*?\n  }/)?.[0] || ''), 'analytics helper has no coordinate fields');
assert(authorityJs.includes("query_length"), 'unsupported authority analytics use length only');
assert(frenchAuthorityHtml.includes('data-paye-authority-fr'), 'French authority route has a native workflow');
assert(frenchAuthorityHtml.includes('/assets/js/engines/paye-authority-router-engine.js'), 'French authority route reuses the canonical engine');
assert(frenchAuthorityHtml.includes("fetch('/data/salary-tax/authority-router.json'"), 'French authority route reuses the canonical dataset');
assert(frenchAuthorityHtml.includes('<link rel="canonical" href="https://afrotools.com/fr/tools/trouver-administration-paye/">'), 'French authority route is self-canonical');
assert(!/source-launch|data-fr-prep|<iframe\b/i.test(frenchAuthorityHtml), 'French authority route is not a bridge or English transplant');

console.log('GSC demand capture product contracts passed.');
