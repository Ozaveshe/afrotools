'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');

function read(file) { return fs.readFileSync(path.join(root, file), 'utf8'); }
const newFiles = [
  'assets/js/engines/wallet-address-validator.js',
  'assets/js/pages/wallet-address-validator.js',
  'assets/css/wallet-address-validator.css',
  'crypto/address-validator/index.html',
  'fr/crypto/address-validator/index.html',
  'data/ai/tool-context/crypto-address.json'
];

test('new validator surfaces contain no mojibake markers', () => {
  for (const file of newFiles) assert.doesNotMatch(read(file), /Ã|Â|â(?:€|€™|€¦)|�/, file);
});

for (const file of ['crypto/address-validator/index.html', 'fr/crypto/address-validator/index.html']) {
  test(file + ' is native, private, crawlable and accurately scoped', () => {
    const html = read(file);
    assert.doesNotMatch(html, /<iframe|crypto-scam|scam database|localStorage|sessionStorage|fetch\s*\(/i);
    assert.match(html, /FAQPage/);
    assert.match(html, /walletValidatorForm/);
    assert.match(html, /BIP 173/);
    assert.match(html, /PDF/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
  });
}

test('controller makes no network or persistence call and uses safe DOM writes', () => {
  const js = read('assets/js/pages/wallet-address-validator.js');
  assert.doesNotMatch(js, /\bfetch\s*\(|XMLHttpRequest|localStorage|sessionStorage|innerHTML|insertAdjacentHTML/);
  assert.match(js, /textContent/);
  assert.match(js, /replaceChildren/);
  assert.match(js, /requestId/);
});

test('AI context is route-only and fail closed', () => {
  const context = JSON.parse(read('data/ai/tool-context/crypto-address.json'));
  assert.equal(context.status, 'unverified-static');
  assert.match(context.staticText, /without requesting, prefilling, repeating or transmitting/i);
  assert.match(context.staticText, /no balance/i);
});
