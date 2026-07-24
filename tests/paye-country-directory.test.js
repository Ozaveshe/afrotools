#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const directory = require('../assets/js/pages/paye-country-directory.js');
const manifest = require('../assets/js/ai/tool-manifest.js').MAJOR_TOOL_OVERRIDES['paye-calculator'];

assert.strictEqual(directory.countries.length, 54, 'all African country choices should stay visible');
assert.strictEqual(directory.countries.filter(country => country.route).length, 53, 'only source-backed destinations should be marked supported');
assert.deepStrictEqual(directory.resolveCountry('KE', 'en'), {
  code: 'KE',
  name: 'Kenya',
  supported: true,
  route: '/kenya/ke-paye',
  localized: false,
  languageFallback: false
});
assert.strictEqual(directory.resolveCountry('SN', 'fr').route, '/fr/senegal/calculateur-salaire-net');
assert.strictEqual(directory.resolveCountry('SN', 'fr').localized, true);
assert.strictEqual(directory.resolveCountry('GH', 'fr').route, '/ghana/gh-paye');
assert.strictEqual(directory.resolveCountry('GH', 'fr').languageFallback, true);
assert.deepStrictEqual(directory.resolveCountry('GW', 'en'), {
  code: 'GW',
  name: 'Guinea-Bissau',
  supported: false,
  route: null,
  localized: false,
  languageFallback: false
});
assert.strictEqual(directory.resolveCountry('XX', 'en'), null);

assert.deepStrictEqual(manifest.aiCapabilities, ['route_only', 'prefill']);
assert.deepStrictEqual(manifest.requiredInputs.map(input => input.name), ['country']);
assert.deepStrictEqual(manifest.optionalInputs.map(input => input.name), ['grossPay', 'payPeriod']);
assert.deepStrictEqual(manifest.outputTypes, ['shortlist']);
assert.strictEqual(manifest.privacyMode, 'browser_local');
assert.strictEqual(manifest.sourcePolicy, 'mixed');
assert.deepStrictEqual(manifest.monetizationSurfaces, []);
assert.deepStrictEqual(manifest.currencySupport, ['MULTI']);

for (const relative of ['tools/paye-calculator/index.html', 'fr/tools/calculateur-paye/index.html']) {
  const html = fs.readFileSync(path.join(root, relative), 'utf8');
  assert.match(html, /"@type":\s*"CollectionPage"/);
  assert.doesNotMatch(html, /type=["']number["']/i);
  assert.doesNotMatch(html, /gross (monthly )?salary/i);
  assert.doesNotMatch(html, /WebApplication/);
  assert.match(html, /PDF/i);
}
const englishHtml = fs.readFileSync(path.join(root, 'tools/paye-calculator/index.html'), 'utf8');
const frenchHtml = fs.readFileSync(path.join(root, 'fr/tools/calculateur-paye/index.html'), 'utf8');
function browseLinkCount(html) {
  const browse = (html.match(/<details class="paye-browse">([\s\S]*?)<\/details>/) || [])[1] || '';
  return (browse.match(/<li><a href=/g) || []).length;
}
assert.strictEqual(browseLinkCount(englishHtml), 53, 'English crawlable index should expose every supported country route');
assert.strictEqual(browseLinkCount(frenchHtml), 21, 'French crawlable index should expose every localized country route');
assert.match(englishHtml, /Guinea-Bissau — unsupported/);

const netlify = fs.readFileSync(path.join(root, 'netlify.toml'), 'utf8');
assert.doesNotMatch(netlify, /from = "\/tools\/paye-calculator\/"\s+to = "\/salary-tax\/"/);
const redirects = fs.readFileSync(path.join(root, '_redirects'), 'utf8');
assert.match(redirects, /\/fr\/tools\/paye-calculator\/\s+\/fr\/tools\/calculateur-paye\/\s+301/);

console.log('paye-country-directory.test.js passed');
