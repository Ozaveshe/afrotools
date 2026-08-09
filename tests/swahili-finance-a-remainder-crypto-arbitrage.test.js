'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const worksheet = require('../assets/js/pages/crypto-arbitrage-worksheet.js');

const root = path.resolve(__dirname, '..');
const lane = JSON.parse(fs.readFileSync(path.join(root, 'data/localization/sw-finance-a-remainder-crypto-arbitrage.json'), 'utf8'));
const sw = fs.readFileSync(path.join(root, 'sw/zana/karatasi-ya-arbitrage-ya-crypto/index.html'), 'utf8');
const en = fs.readFileSync(path.join(root, 'crypto/arbitrage/index.html'), 'utf8');
const fr = fs.readFileSync(path.join(root, 'fr/crypto/arbitrage/index.html'), 'utf8');
const script = fs.readFileSync(path.join(root, 'assets/js/pages/crypto-arbitrage-worksheet.js'), 'utf8');
const registry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');

assert.equal(lane.englishId, 'crypto-arbitrage');
assert.equal(lane.financeAPosition, 8);
assert.equal(lane.financeBOverlap, false);
assert.equal(lane.candidateDelta, 1);
assert.equal(lane.centralAcceptanceMutation, false);
assert.match(sw, /<html lang="sw"/);
assert.match(sw, /rel="canonical" href="https:\/\/afrotools\.com\/sw\/zana\/karatasi-ya-arbitrage-ya-crypto\/"/);
assert.match(sw, /"inLanguage":"sw"/);
assert.match(sw, /assets\/img\/tools\/crypto-arbitrage\.webp/);
assert.match(sw, /Hakuna bei ya moja kwa moja/);
assert.doesNotMatch(sw, /guaranteed|official rate|live price|AI-powered/i);
assert.match(en, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/karatasi-ya-arbitrage-ya-crypto\/"/);
assert.match(fr, /hreflang="sw" href="https:\/\/afrotools\.com\/sw\/zana\/karatasi-ya-arbitrage-ya-crypto\/"/);
assert.match(script, /sw:\{title:'Karatasi ya uwezekano/);
assert.match(registry, /id: "crypto-arbitrage-sw-parity"/);
assert.ok(fs.existsSync(path.join(root, 'assets/img/tools/crypto-arbitrage.webp')));

const now = Date.parse('2026-08-09T12:00:00Z');
const result = worksheet.calculate({
  assetCode: 'USDT', assetAmount: '100', buyDebit: '150000', sellCredit: '156000', externalCosts: '1000',
  buyChecked: '2026-08-09T10:00:00Z', buyExpiry: '2026-08-09T13:00:00Z',
  sellChecked: '2026-08-09T10:05:00Z', sellExpiry: '2026-08-09T13:05:00Z', confirmed: true
}, now);
assert.equal(result.ok, true);
assert.equal(result.grossDifference, 6000);
assert.equal(result.netDifference, 5000);
assert.equal(result.breakEvenSellCredit, 151000);
assert.ok(Math.abs(result.returnPct - (5000 / 150000 * 100)) < 1e-12);
assert.equal(worksheet.calculate({ assetCode: 'USDT' }, now).ok, false);

console.log('swahili finance A remainder crypto-arbitrage: 18 assertions passed');
