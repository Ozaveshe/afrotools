'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const surfaces = ['crypto/exchange-ratings/index.html','fr/crypto/exchange-ratings/index.html','assets/js/engines/exchange-due-diligence.js','assets/js/pages/exchange-due-diligence.js','assets/css/exchange-due-diligence.css','data/ai/tool-context/crypto-exchange.json'];

test('new surfaces have no mojibake, provider scores, reviews, Supabase, fetch or affiliate flow', () => {
  const body = surfaces.map(read).join('\n');
  assert.doesNotMatch(body, /Ã|Â|â(?:€|€™|€¦)|�/);
  assert.doesNotMatch(body, /supabase|crypto_exchange_reviews|\bfetch\s*\(|affiliate|trust_score|community-verified|Submit Your Review/i);
  assert.doesNotMatch(read('assets/js/pages/exchange-due-diligence.js'), /innerHTML|insertAdjacentHTML|localStorage|sessionStorage/);
});

for (const file of ['crypto/exchange-ratings/index.html','fr/crypto/exchange-ratings/index.html']) {
  test(file + ' is native and crawlable with matching FAQ/schema boundaries', () => {
    const html = read(file);
    assert.doesNotMatch(html, /<iframe/);
    assert.match(html, /FAQPage/);
    assert.match(html, /WebApplication/);
    assert.match(html, /hreflang="en"/);
    assert.match(html, /hreflang="fr"/);
    assert.match(html, /FSCA/);
    assert.match(html, /FATF|GAFI/);
    assert.match(html, /PDF/);
  });
}

test('AI context is route-only and prohibits verdicts and prefill', () => {
  const context = JSON.parse(read('data/ai/tool-context/crypto-exchange.json'));
  assert.equal(context.status, 'unverified-static');
  assert.match(context.staticText, /without requesting, prefilling, repeating or transmitting/i);
  assert.match(context.staticText, /never produces a trust score/i);
});
