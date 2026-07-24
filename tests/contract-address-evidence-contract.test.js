'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

test('unsupported legacy allegations are quarantined in an empty provenance registry', () => {
  const registry = JSON.parse(read('data/crypto/scam-reports.json'));
  assert.equal(registry.schemaVersion, 2);
  assert.equal(registry.registryType, 'curated-contract-address-evidence');
  assert.match(registry.reviewedAt, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(registry.records.length, 0);
  assert.match(registry.provenance, /Unsupported legacy allegations were removed/);
  assert.doesNotMatch(JSON.stringify(registry), /PetraNova|AfriYield|GoldMine|Uniswap Router|rpt-00/i);
});

for (const file of ['crypto/contract-scanner/index.html','fr/crypto/contract-scanner/index.html']) {
  test(file + ' is native, crawlable and bounded', () => {
    const html = read(file);
    assert.doesNotMatch(html, /<iframe|english-df-app-upgrades|class="safety-score|holder concentration|300%|AfriToken/i);
    assert.match(html, /FAQPage/);
    assert.match(html, /WebApplication/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /40 (?:hexadecimal|caractères hexadécimaux)/i);
    assert.match(html, /does not prove|ne prouve/i);
  });
}

test('French source is UTF-8 native without mojibake', () => {
  const french = read('fr/crypto/contract-scanner/index.html') + read('assets/js/pages/contract-address-evidence.js');
  assert.match(french, /Vérification de preuves d’adresse|Chaîne EVM|Enregistrement exact révisé/);
  assert.doesNotMatch(french, /Ã.|â€™|â€¦|ï¿½/);
});

test('controller is safe-DOM and only loads the address-free local registry', () => {
  const page = read('assets/js/pages/contract-address-evidence.js');
  assert.doesNotMatch(page, /innerHTML|insertAdjacentHTML|localStorage|sessionStorage|sendBeacon|analytics|ethereum\.request|window\.web3/i);
  assert.match(page, /fetch\('\/data\/crypto\/scam-reports\.json'/);
  assert.doesNotMatch(page, /fetch\([^)]*address|XMLHttpRequest|WebSocket/i);
});

test('AI context and manifest are route-only with no address inputs or monetization', () => {
  const context = JSON.parse(read('data/ai/tool-context/crypto-contract.json'));
  assert.match(context.staticText, /must never request, prefill, repeat or transmit an address/i);
  const manifest = require('../assets/js/ai/tool-manifest.js').MAJOR_TOOL_OVERRIDES['crypto-contract'];
  assert.deepEqual(manifest.aiCapabilities, ['route_only']);
  assert.deepEqual(manifest.requiredInputs, []);
  assert.deepEqual(manifest.optionalInputs, []);
  assert.deepEqual(manifest.monetizationSurfaces, []);
  assert.equal(manifest.privacyMode, 'browser_local');
});
