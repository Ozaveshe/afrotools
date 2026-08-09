'use strict';

const assert = require('assert');
const fs = require('fs');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const inventory = JSON.parse(fs.readFileSync('reports/swahili-free-app-parity-inventory.json'));
const acceptance = JSON.parse(fs.readFileSync('data/audits/swahili-free-app-acceptance.json'));
const excluded = new Set(['proforma-invoice', 'packing-list', 'bol-generator', 'customs-time', 'shipping-weight', 'cross-border-data']);
const rows = inventory.rows.filter((row) => ['small-business', 'fintech', 'transport', 'trade'].includes(row.categoryKey));
assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => excluded.has(row.englishId)).length, 6);
assert.strictEqual(rows.filter((row) => !excluded.has(row.englishId)).length, 93);

const apps = [
  ['dca-calc', 'sw/zana/ununuzi-wa-mara-kwa-mara/index.html', 'dca-calc.js', '/sw/zana/ununuzi-wa-mara-kwa-mara/'],
  ['dividend-yield', 'sw/zana/mavuno-ya-gawio/index.html', 'dividend-yield.js', '/sw/zana/mavuno-ya-gawio/'],
  ['net-worth', 'sw/zana/thamani-halisi/index.html', 'net-worth.js', '/sw/zana/thamani-halisi/'],
];
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: apps.map(([id,,,swahiliRoute]) => ({ id, swahiliRoute })) });

for (const [id, file, controller] of apps) {
  const html = fs.readFileSync(file, 'utf8');
  assert(html.includes('scripts/build-sw-fintech-wealth-family.js'));
  assert(html.includes(`/fintech-shared-controllers/${controller}`));
  assert(html.includes(`data-ai-candidate-tool-id="${id}"`));
  assert(html.includes(`href="/sw/ai/?tool=${id}"`));
  assert(html.includes('Udhamini au ushirika'));
  assert(html.includes('Hakuna data inayotumwa kwa seva'));
  assert(!/<iframe\b/i.test(html));
  assert(!/(Pakua|Download|CSV|PDF|Nakili)/i.test(html));
}

console.log('Swahili Fintech wealth family: immutable 99/6/93 allocation and 3/3 lifecycle-aware route contracts passed');
