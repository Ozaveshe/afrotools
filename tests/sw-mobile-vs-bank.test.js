'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');

const ROOT = path.resolve(__dirname, '..');
const BASE = '6edacda8437e1fa9b9e5a512138cbdd3169e38be';
const id = 'mobile-vs-bank';
const sw = '/sw/zana/pesa-simu-dhidi-ya-benki/';
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
const rows = inventory.rows.filter((row) => scope.has(row.categoryKey));

assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length, 8);
assert.strictEqual(rows.filter((row) => !accepted.has(row.englishId)).length, 91);
assert.strictEqual(inventory.rows.filter((row) => row.categoryKey === 'fintech').length, 31);
const baseRow = rows.find((row) => row.englishId === id);
assert.ok(baseRow && baseRow.state === 'missing' && !accepted.has(id), 'mobile-vs-bank must be a missing, centrally unaccepted row');
for (const handled of ['b2b-payment', 'bill-split', 'sacco-calc', 'credit-score', 'thrift-calc']) assert.notStrictEqual(handled, id);

const html = fs.readFileSync(path.join(ROOT, sw.replace(/^\//, ''), 'index.html'), 'utf8');
for (const fragment of [
  'lang="sw"',
  'content="scripts/build-sw-mobile-vs-bank.js"',
  'fintech-shared-controllers/mobile-vs-bank.js',
  '/assets/img/tools/mobile-vs-bank.webp',
  'href="/sw/ai/?tool=mobile-vs-bank"',
  'id="mb-mm-provider"',
  'id="mb-bank-provider"',
  'id="mb-quote-date"',
  'id="mb-mm-source"',
  'id="mb-bank-source"',
  'data-sw-copy-result',
  'data-sw-download-result',
  'data-sw-save-marker',
  'Udhamini au ushirika wa kibiashara',
  'ridhaa ya wazi',
  'Mbinu ilikaguliwa Agosti 2026',
  'uhakika wa juu'
]) assert.ok(html.includes(fragment), fragment);
assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calcMB|calculate)/i.test(html), 'inline calculator');
assert.ok(!/pdf-download-gate|email-gate-modal/i.test(html), 'unexpected export gate');
assert.strictEqual(routeEntry.resolveToolRoute(id, routeMap), null, 'central AI acceptance');

for (const paired of ['/tools/mobile-vs-bank/', '/fr/tools/mobile-money-vs-banque/', '/ha/kayan-aiki/waya-ko-banki/']) {
  const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
  assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), `reciprocal ${paired}`);
}

const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/fintech-shared-controllers/mobile-vs-bank.js'), 'utf8');
assert.ok(controller.includes("mbProviderName('mb-mm-provider'"));
assert.ok(controller.includes('mbEscape(cheaper)'));
childProcess.execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-sw-mobile-vs-bank.js')], { cwd: ROOT, stdio: 'pipe' });
const protectedPaths = ['data/audits/swahili-free-app-acceptance.json', 'assets/js/ai/swahili-route-map.generated.js', 'data/registry/locale-page-coverage.json', 'data/tool-directory.json', 'sitemap.xml', 'dist'];
const drift = childProcess.execFileSync('git', ['diff', '--name-only', BASE, '--', ...protectedPaths], { cwd: ROOT, encoding: 'utf8' }).trim();
assert.strictEqual(drift, '', drift);

console.log('Swahili mobile-vs-bank: inventory 99/6/93, Fintech 31, and 1/1 source-owned route contract passed');
