'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const ROOT = path.resolve(__dirname, '..');
const id = 'qr-payment';
const sw = '/sw/zana/gharama-za-malipo-ya-qr/';
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
const rows = inventory.rows.filter((row) => scope.has(row.categoryKey));

assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length + rows.filter((row) => !accepted.has(row.englishId)).length, 99);
assert.strictEqual(inventory.rows.filter((row) => row.categoryKey === 'fintech').length, 31);
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: [{ id, swahiliRoute: sw }] });
for (const handled of ['b2b-payment', 'bill-split', 'sacco-calc', 'credit-score', 'thrift-calc', 'mobile-vs-bank']) assert.notStrictEqual(handled, id);

const html = fs.readFileSync(path.join(ROOT, sw.replace(/^\//, ''), 'index.html'), 'utf8');
for (const fragment of [
  'lang="sw"',
  'content="scripts/build-sw-qr-payment.js"',
  'fintech-shared-controllers/qr-payment.js',
  '/assets/img/tools/qr-payment.webp',
  'href="/sw/ai/?tool=qr-payment"',
  'id="qr-country"',
  'id="qr-currency"',
  'id="qr-quote-date"',
  'id="qr-source"',
  'id="qr-provider"',
  'id="qr-pos-provider"',
  'id="qr-mm-provider"',
  'id="qr-cash-label"',
  'Udhamini au ushirika wa kibiashara',
  'ridhaa ya wazi',
  'Mbinu ilikaguliwa Agosti 2026',
  'uhakika wa juu'
]) assert.ok(html.includes(fragment), fragment);
assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calcQR|calculate)/i.test(html), 'inline calculator');
assert.ok(!/data-export|data-sw-copy|data-sw-download|pdf-download-gate|email-gate-modal/i.test(html), 'unowned export or export gate');

for (const paired of ['/tools/qr-payment/', '/fr/tools/cout-paiement-qr/']) {
  const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
  assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), `reciprocal ${paired}`);
}
const frSource = fs.readFileSync(path.join(ROOT, 'data/localization/fr-fintech-banking-pages/qr-payment.html'), 'utf8');
assert.ok(frSource.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), 'French source reciprocal');

const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/fintech-shared-controllers/qr-payment.js'), 'utf8');
assert.ok(controller.includes("qrMethodName('qr-provider'"));
assert.ok(controller.includes('qrEscape(m.name)'));
console.log('Swahili qr-payment: immutable 99-row scope, Fintech 31, and lifecycle-aware route contract passed');
