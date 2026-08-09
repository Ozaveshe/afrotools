'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const engine = require('../engines/src/ke-stamp-duty-engine.js');

const root = path.resolve(__dirname, '..');
const route = '/sw/zana/kikokotoo-ushuru-wa-stampu-kenya/';
const swPath = path.join(root, 'sw/zana/kikokotoo-ushuru-wa-stampu-kenya/index.html');
const enPath = path.join(root, 'tools/ke-stamp-duty/index.html');
const frPath = path.join(root, 'fr/tools/ke-droits-timbre/index.html');
const controllerPath = path.join(root, 'assets/js/pages/ke-stamp-duty-vip.js');
const sw = fs.readFileSync(swPath, 'utf8');
const en = fs.readFileSync(enPath, 'utf8');
const fr = fs.readFileSync(frPath, 'utf8');
const controller = fs.readFileSync(controllerPath, 'utf8');

assert.strictEqual(engine.RULES.verifiedThrough, '2026-07-23');
assert.match(engine.RULES.source, /Kenya Law consolidated Stamp Duty Act/);

const transfer = engine.calculate({
  instrumentDate: '2026-07-23',
  mode: 'transfer',
  location: 'municipality',
  transactionType: 'sale',
  consideration: 15000000,
  marketValue: 15000000
});
assert.strictEqual(transfer.ok, true);
assert.strictEqual(transfer.dutiableValue, 15000000);
assert.strictEqual(transfer.transferDuty, 600000);
assert.strictEqual(transfer.payable, 600000);

const lease = engine.calculate({
  instrumentDate: '2026-07-23',
  mode: 'lease',
  location: 'municipality',
  termType: 'definite',
  termYears: 2,
  annualRent: 1200000,
  premium: 1000000
});
assert.strictEqual(lease.ok, true);
assert.strictEqual(lease.rentDuty, 12000);
assert.strictEqual(lease.premiumDuty, 40000);
assert.strictEqual(lease.payable, 52000);

assert.deepStrictEqual(engine.calculate({
  instrumentDate: '2026-07-24',
  mode: 'transfer',
  location: 'municipality',
  transactionType: 'sale',
  consideration: 15000000,
  marketValue: 15000000
}), { ok: false, error: 'unsupported_date' });

assert.match(sw, /<html lang="sw">/);
assert.match(sw, /data-ke-stamp-duty data-locale="sw"/);
assert.match(sw, /\/engines\/ke-stamp-duty-engine\.js/);
assert.match(sw, /\/assets\/js\/pages\/ke-stamp-duty-vip\.js/);
assert.match(sw, /Kenya Law: Stamp Duty Act, Cap\. 480/);
assert.match(sw, /Imepitiwa 23 Julai 2026/);
assert.match(sw, /assets\/img\/tools\/ke-stamp-duty\.webp/);
assert.match(sw, new RegExp(`rel="canonical" href="https://afrotools\\.com${route}"`));
assert.match(sw, /hreflang="en" href="https:\/\/afrotools\.com\/tools\/ke-stamp-duty\/"/);
assert.match(sw, /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/tools\/ke-droits-timbre\/"/);
assert.match(sw, new RegExp(`hreflang="sw" href="https://afrotools\\.com${route}"`));
assert.match(en, new RegExp(`hreflang="sw" href="https://afrotools\\.com${route}"`));
assert.match(fr, new RegExp(`hreflang="sw" href="https://afrotools\\.com${route}"`));
assert.match(sw, /"inLanguage":"sw"/);
assert.match(sw, /"@type":"FAQPage"/);
assert.doesNotMatch(sw, /<iframe\b/i);
assert.doesNotMatch(sw, /\b(?:Calculate|Reset|Copy|Download|Planning duty payable|Related tools)\b/);
assert.match(controller, /sw:\s*\{/);
assert.match(controller, /makadirio-ushuru-stampu-kenya/);
assert.match(controller, /function localRateLabel/);
assert.match(controller, /function localBoundary/);

console.log('Swahili Kenya stamp duty: transfer, lease, source, route and localization contracts passed');
