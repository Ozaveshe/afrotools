'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
function escapeRegex(value) { return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
const newFiles = [
  'assets/js/engines/wallet-address-validator.js',
  'assets/js/pages/wallet-address-validator.js',
  'assets/css/wallet-address-validator.css',
  'crypto/address-validator/index.html',
  'fr/crypto/address-validator/index.html',
  'sw/crypto/address-validator/index.html',
  'data/ai/tool-context/crypto-address.json'
];

test('new validator surfaces contain no mojibake markers', () => {
  for (const file of newFiles) assert.doesNotMatch(read(file), /Ã|Â|â(?:€|€™|€¦)|�/, file);
});

for (const file of ['crypto/address-validator/index.html', 'fr/crypto/address-validator/index.html', 'sw/crypto/address-validator/index.html']) {
  test(file + ' is native, private, crawlable and accurately scoped', () => {
    const html = read(file);
    assert.doesNotMatch(html, /<iframe|crypto-scam|scam database|localStorage|sessionStorage|fetch\s*\(/i);
    assert.match(html, /FAQPage/);
    assert.match(html, /walletValidatorForm/);
    assert.match(html, /BIP 173/);
    assert.match(html, /PDF/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /hreflang="sw"/);
  });
}

test('the locale-family manifest owns exact reciprocal metadata and Swahili discovery', () => {
  const manifest = JSON.parse(read('data/localization/sw-finance-remainder-native-owners.json'));
  const owner = manifest.rows.find((row) => row.englishId === 'crypto-address');
  assert(owner);
  for (const [locale, file] of Object.entries(owner.localeOwners)) {
    const html = read(file);
    assert.match(
      html,
      new RegExp(`<link\\b(?=[^>]*rel=["']canonical["'])[^>]*href=["']https://afrotools\\.com${escapeRegex(owner.reciprocalRoutes[locale])}["']`, 'i'),
      `${locale}: canonical`
    );
    for (const [hreflang, route] of Object.entries(owner.reciprocalRoutes)) {
      assert.match(
        html,
        new RegExp(`<link\\b(?=[^>]*rel=["']alternate["'])(?=[^>]*hreflang=["']${escapeRegex(hreflang)}["'])[^>]*href=["']https://afrotools\\.com${escapeRegex(route)}["']`, 'i'),
        `${locale}: ${hreflang} reciprocal route`
      );
    }
    assert.match(html, /wallet-address-validator\.js\?v=b0e4cb9a/);
  }
  const registry = read(owner.discoveryOwner.file);
  assert.equal(
    [...registry.matchAll(new RegExp(`id:\\s*['"]${escapeRegex(owner.discoveryOwner.id)}['"]`, 'g'))].length,
    1
  );
  assert.match(
    registry,
    new RegExp(
      `id:\\s*['"]${escapeRegex(owner.discoveryOwner.id)}['"][^\\n]*href:\\s*['"]${escapeRegex(owner.reciprocalRoutes.sw)}['"][^\\n]*lang:\\s*['"]sw['"][^\\n]*sourceId:\\s*['"]${escapeRegex(owner.discoveryOwner.sourceId)}['"]`
    )
  );
});

test('native Swahili owner keeps the English controls and real export while removing generic proof UI', () => {
  const html = read('sw/crypto/address-validator/index.html');
  assert.match(html, /lang="sw"/);
  assert.match(html, /walletNetwork/);
  assert.match(html, /walletAddress" maxlength="120" required autocomplete="off" spellcheck="false"/);
  assert.match(html, /walletCopy/);
  assert.match(html, /wallet-address-validator\.js/);
  assert.match(html, /wallet-address-validator\.js\?v=b0e4cb9a/);
  assert.doesNotMatch(html, /swahili-finance-remainder-parity|data-sw-finance-json-export|data-sw-finance-ai-consent|lazy-analytics/i);
  assert.doesNotMatch(html, /Private, local validation|Choose the intended network|Check an address|Validation receipt|Checks performed|What this cannot prove|Related tools/i);
});

test('controller makes no network or persistence call and uses safe DOM writes', () => {
  const js = read('assets/js/pages/wallet-address-validator.js');
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|insertAdjacentHTML/);
  assert.match(js, /textContent/);
  assert.match(js, /replaceChildren/);
  assert.match(js, /requestId/);
  assert.match(js, /function clearVisibleResult\(\)/);
  assert.match(js, /result\.status === 'invalid'/);
  assert.match(js, /if \(!lastReceipt \|\| copy\.disabled\) return/);
  assert.match(js, /form\.addEventListener\('invalid'/);
});

test('changed and invalid input synchronously remove the prior visible and portable result', () => {
  const js = read('assets/js/pages/wallet-address-validator.js');
  assert.match(js, /function markStale\(\)[\s\S]*clearVisibleResult\(\)/);
  assert.match(js, /address\.addEventListener\('input', markStale\)/);
  assert.match(js, /network\.addEventListener\('change', markStale\)/);
  assert.match(js, /form\.addEventListener\('invalid', function \(\)[\s\S]*clearVisibleResult\(\)/);
  assert.match(js, /output\.replaceChildren\(placeholder\)/);
  assert.match(js, /function clearPortableState\(\)/);
});

test('copy remains fail closed when disabled, stale or rejected by the clipboard', () => {
  const js = read('assets/js/pages/wallet-address-validator.js');
  assert.match(js, /if \(!lastReceipt \|\| copy\.disabled\) return/);
  assert.match(js, /if \(receipt !== lastReceipt\) return/);
  assert.match(js, /catch \(error\)[\s\S]*copyFailed/);
  assert.doesNotMatch(js, /navigator\.share|new Blob|createObjectURL|\.save\(/);
});

test('candidate receipt contains only the accepted crypto-address row', () => {
  const receipt = JSON.parse(read('reports/swahili-finance-remainder-crypto-address-receipt.json'));
  assert.deepEqual(receipt.totals, { scoped: 1, accepted: 1, blocked: 0 });
  assert.deepEqual(receipt.partitions.financial, { scoped: 1, accepted: 1, blocked: 0 });
  assert.deepEqual(receipt.acceptedRows.map((row) => row.englishId), ['crypto-address']);
  assert.equal(Object.hasOwn(receipt, 'blockedEnglishIds'), false);
});

test('native Swahili owner does not load analytics or shared AI routing', () => {
  const html = read('sw/crypto/address-validator/index.html');
  assert.doesNotMatch(html, /lazy-analytics|intent-router|swahili-route-map|data-sw-finance-ai-consent/i);
  assert.match(html, /wallet-address-validator\.js\?v=b0e4cb9a/);
});

test('native Swahili metadata is self-owned and reuses present artwork', () => {
  const html = read('sw/crypto/address-validator/index.html');
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/sw\/crypto\/address-validator\/">/);
  assert.match(html, /"inLanguage": "sw"/);
  assert.match(html, /property="og:image" content="https:\/\/afrotools\.com\/assets\/img\/tools\/crypto-address\.webp"/);
  assert.equal(fs.existsSync(path.join(root, 'assets/img/tools/crypto-address.webp')), true);
});

test('app-specific AI context blocks sensitive input without owning shared routing', () => {
  const context = JSON.parse(read('data/ai/tool-context/crypto-address.json'));
  assert.equal(context.status, 'unverified-static');
  assert.equal(context.localizedRoutes.sw, '/sw/crypto/address-validator/');
  assert.match(context.staticText, /without requesting, prefilling, repeating or transmitting/i);
  assert.match(context.staticText, /no balance/i);
});
