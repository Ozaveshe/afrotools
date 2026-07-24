'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const manifest = require('../assets/js/ai/tool-manifest.js');

const root = path.resolve(__dirname, '..');
const read = relative => fs.readFileSync(path.join(root, relative), 'utf8');
const en = read('crypto/dca-calculator/index.html');
const fr = read('fr/crypto/dca-calculator/index.html');
const pageJs = read('assets/js/pages/crypto-dca-replay.js');
const widgetHtml = read('widgets/iframe/crypto-dca-calculator.html');
const widgetJs = read('widgets/crypto/dca-calc.js');
const netlify = read('netlify.toml');
const registry = read('assets/js/components/tool-registry.js');
const sourceRegistry = JSON.parse(read('data/source-registry.json'));

for (const [locale, html] of [['en', en], ['fr', fr]]) {
  assert.match(html, new RegExp(`<html\\b[^>]*\\blang="${locale}"`));
  assert.match(html, /assets\/vendor\/jspdf\/jspdf\.umd\.min\.js/);
  assert.match(html, /assets\/js\/engines\/crypto-dca-replay\.js/);
  assert.match(html, /assets\/js\/pages\/crypto-dca-replay\.js/);
  assert.match(html, /aria-live="polite"/);
  assert.match(html, /aria-controls="dca-history-scroll"/);
  assert.match(html, /prefers-reduced-motion|crypto-dca-replay\.css/);
  assert.doesNotMatch(html, /cdn\.jsdelivr|chart\.js|crypto-data\.js|translation.+pending|traduction.+venir/i);
}

assert.doesNotMatch(pageJs, /localStorage|sessionStorage|indexedDB/);
assert.match(pageJs, /new URLSearchParams\(\{\s*asset: input\.asset,\s*currency: input\.currency,\s*from: input\.startDate,\s*to: input\.endDate/s);
assert.doesNotMatch(widgetHtml + widgetJs, /crypto-tax|Calculate DCA|Current Value|Profit\s*\/\s*Loss|Math\.sin/i);
assert.match(widgetHtml + widgetJs, /crypto\/dca-calculator/);
assert.match(widgetJs, /does not calculate or collect financial inputs/);
assert.match(netlify, /from = "\/api\/crypto-dca-history"/);
assert.match(registry, /id: 'crypto-dca'.+Historical Crypto DCA Replay/);

const tool = manifest.loadDefaultToolManifest().find(entry => entry.id === 'crypto-dca');
assert.ok(tool);
assert.deepEqual(tool.aiCapabilities, ['route_only']);
assert.deepEqual(tool.languagesSupported, ['en', 'fr']);
assert.deepEqual(tool.currencySupport, ['NGN', 'ZAR', 'USD']);
assert.deepEqual(tool.requiredInputs, []);
assert.equal(tool.highStakesDomain, 'finance');
assert.equal(tool.sourcePolicy, 'mixed');
assert.equal(manifest.buildToolInvocation(tool).canPrefill, false);
assert.equal(manifest.buildToolInvocation(tool).invocationMode, 'route_only');

const source = sourceRegistry.sources.find(entry => entry.id === 'crypto-dca-coingecko-history');
assert.ok(source);
assert.equal(source.sourceType, 'third_party_snapshot');
assert.equal(source.confidence, 'reviewed');
assert.deepEqual(source.toolIds, ['crypto-dca']);

console.log('crypto-dca-product: ok');
