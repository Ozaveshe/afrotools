'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const ROOT = path.resolve(__dirname, '..');
const apps = [
  ['b2b-payment', 'sw/zana/malipo-ya-biashara-kwa-biashara/index.html', '/sw/zana/malipo-ya-biashara-kwa-biashara/', '/tools/b2b-payment/', '/fr/tools/paiement-b2b-transfrontalier/'],
  ['bill-split', 'sw/zana/kigawanya-bili-na-bakshishi/index.html', '/sw/zana/kigawanya-bili-na-bakshishi/', '/tools/bill-split/', '/fr/tools/partage-addition/']
];
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const normalizeRoute = (route) => `/${String(route || '').replace(/^\/+|\/+$/g, '')}/`;
assert.strictEqual(inventory.rows.length, 1256);
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: apps.map(([id,,swahiliRoute]) => ({ id, swahiliRoute })) });

for (const [id, file, sw, en, fr] of apps) {
  const inventoryRow = inventory.rows.find((row) => row.englishId === id);
  assert.ok(inventoryRow, `${id}: authoritative inventory row`);
  assert.strictEqual(normalizeRoute(inventoryRow.primarySwahiliRoute), normalizeRoute(sw), `${id}: authoritative route`);
  assert.ok(accepted.has(id), `${id}: central acceptance`);
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  assert.ok(html.includes('lang="sw"'), id);
  assert.ok(html.includes('content="scripts/build-sw-fintech-payment-allocation.js"'), id);
  assert.ok(html.includes(`href="https://afrotools.com${sw}"`), id);
  assert.ok(html.includes(`/assets/img/tools/${id}.webp`), id);
  assert.ok(html.includes(`fintech-shared-controllers/${id}.js`), id);
  assert.ok(html.includes(`href="/sw/ai/?tool=${id}"`), id);
  assert.ok(html.includes('Udhamini au ushirika wa kibiashara'), id);
  assert.ok(html.includes('ridhaa ya wazi'), id);
  assert.ok(html.includes('Agosti 2026'), id);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calc|calculate)/i.test(html), `${id}: inline calculator`);
  assert.ok(!/download\s*=|data-export=|pdf-download-gate|save-result-button/i.test(html), `${id}: advertised export`);
  assert.strictEqual(normalizeRoute(routeEntry.resolveToolRoute(id, routeMap)), normalizeRoute(sw), `${id}: central AI acceptance`);
  for (const paired of [en, fr]) {
    const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), `${id}: reciprocal ${paired}`);
  }
}

childProcess.execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-sw-fintech-payment-allocation.js')], { cwd: ROOT, stdio: 'pipe' });

console.log('Swahili Fintech payment allocation: authoritative 1,256-row free-app inventory and 2/2 accepted route contracts passed');
