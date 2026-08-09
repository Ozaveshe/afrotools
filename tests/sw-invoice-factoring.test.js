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

const id = 'invoice-factoring';
const swahiliRoute = '/sw/zana/factoring-ankara/';
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: [{ id, swahiliRoute }] });

const html = fs.readFileSync('sw/zana/factoring-ankara/index.html', 'utf8');
for (const fragment of [
  'scripts/build-sw-invoice-factoring.js',
  'fintech-shared-controllers/invoice-factoring.js',
  'data-ai-candidate-tool-id="invoice-factoring"',
  'Nakili muhtasari',
  'Pakua CSV',
  'Udhamini au ushirika',
  'hakuna data inayotumwa kwa seva',
]) assert(html.toLowerCase().includes(fragment.toLowerCase()));
assert(!/<iframe\b/i.test(html));

console.log('Swahili invoice factoring: immutable 99/6/93 allocation and lifecycle-aware route/export contract passed');
