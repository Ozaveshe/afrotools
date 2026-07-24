#!/usr/bin/env node
'use strict';

const assert = require('assert');
const fs = require('fs');

function read(path) {
  return fs.readFileSync(path, 'utf8');
}

const netlify = read('netlify.toml');
const legacyEn = read('crypto/tax-calculator/index.html');
const legacyFr = read('fr/crypto/tax-calculator/index.html');
const canonicalEn = read('tools/crypto-tax/index.html');
const canonicalFr = read('fr/tools/impot-crypto/index.html');
const controller = read('assets/js/pages/crypto-cgt-vip.js');
const widget = read('widgets/crypto/crypto-tax.js');
const widgetFrame = read('widgets/iframe/crypto-crypto-tax.html');
const registry = read('assets/js/components/tool-registry.js');

for (const [from, to] of [
  ['/crypto/tax-calculator', '/tools/crypto-tax/'],
  ['/crypto/tax-calculator/', '/tools/crypto-tax/'],
  ['/fr/crypto/tax-calculator', '/fr/tools/impot-crypto/'],
  ['/fr/crypto/tax-calculator/', '/fr/tools/impot-crypto/'],
]) {
  const pattern = new RegExp(
    '\\[\\[redirects\\]\\]\\s+from = "' + from.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '"\\s+to = "' + to.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
    '"\\s+status = 301\\s+force = true'
  );
  assert.match(netlify, pattern, `${from} must be a forced permanent one-hop alias`);
}

assert.match(legacyEn, /noindex,follow/);
assert.match(legacyEn, /canonical" href="https:\/\/afrotools\.com\/tools\/crypto-tax\//);
assert.match(legacyFr, /canonical" href="https:\/\/afrotools\.com\/fr\/tools\/impot-crypto\//);
assert.doesNotMatch(legacyEn + legacyFr, /CRYPTO_TAX_RULES|Chart\.js|modal-email|Digital Asset Tax.*Math|max\(v,w\)/i);

for (const page of [canonicalEn, canonicalFr]) {
  assert.match(page, /\/engines\/crypto-cgt-engine\.js/);
  assert.match(page, /\/assets\/js\/pages\/crypto-cgt-vip\.js/);
  assert.match(page, /id="cc-classification"/);
  assert.match(page, /id="cc-taxpayer"/);
  assert.match(page, /id="cc-date"/);
  assert.match(page, /id="cc-confirm"/);
  assert.doesNotMatch(page, /fonts\.googleapis|cdn\.jsdelivr|modal-email|localStorage|sessionStorage|indexedDB|fetch\(/i);
}
assert.match(canonicalEn, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/impot-crypto\//);
assert.match(canonicalFr, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/crypto-tax\//);
assert.doesNotMatch(canonicalFr, /value="(?:EG|TZ|UG|RW)"/);
assert.match(canonicalFr, /22 juillet 2026/);

assert.match(controller, /document\.documentElement\.lang/);
assert.match(controller, /Aucune estimation/);
assert.doesNotMatch(controller, /localStorage|sessionStorage|indexedDB|fetch\(/);
assert.doesNotMatch(canonicalEn + canonicalFr, /business-cta|Get API access|White-label version|use the logic through AfroTools API/i);

assert.match(widget, /Open the reviewed calculator/);
assert.match(widget + widgetFrame, /\/tools\/crypto-tax\//);
assert.doesNotMatch(widget, /<input|<select|type="number"|cgtRate|digitalAssetTax|Calculate Tax|Estimated Tax/i);

assert.match(registry, /id: 'crypto-tax'[\s\S]{0,700}href: '\/tools\/crypto-tax\/'[\s\S]{0,700}sourceId: 'crypto-cgt'/);
assert.doesNotMatch(registry.match(/id: 'crypto-tax'[\s\S]{0,700}/)[0], /'EG'|'TZ'|'UG'|'RW'|Freemium/);

assert.strictEqual(fs.existsSync('data/ai/tool-context/crypto-tax.json'), false);

const manifestRows = require('../assets/js/ai/tool-manifest.js').getToolManifestForRouter();
assert.strictEqual(manifestRows.some(tool => tool.id === 'crypto-tax'), false);
const manifest = manifestRows.find(tool => tool.id === 'crypto-cgt');
assert.ok(manifest);
assert.strictEqual(manifest.route, '/tools/crypto-tax/');
assert.deepStrictEqual(manifest.aiCapabilities, ['route_only']);
assert.deepStrictEqual(manifest.requiredInputs, []);
assert.deepStrictEqual(manifest.optionalInputs, []);
assert.deepStrictEqual(manifest.countriesSupported, ['NIGERIA', 'KENYA', 'SOUTH AFRICA', 'GHANA']);
assert.deepStrictEqual(manifest.languagesSupported, ['en', 'fr']);
assert.strictEqual(manifest.sourcePolicy, 'reviewed');

console.log('crypto-tax consolidation contract: ok');
