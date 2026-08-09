'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const ROOT = path.resolve(__dirname, '..');
const id = 'thrift-calc';
const sw = '/sw/zana/kikokotoo-vikundi-vya-akiba-na-mzunguko/';
const file = path.join(ROOT, sw.replace(/^\//, ''), 'index.html');
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
const rows = inventory.rows.filter((row) => scope.has(row.categoryKey));

assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length + rows.filter((row) => !accepted.has(row.englishId)).length, 99);
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: [{ id, swahiliRoute: sw }] });

const html = fs.readFileSync(file, 'utf8');
assert.ok(html.includes('lang="sw"'));
assert.ok(html.includes('content="scripts/build-sw-thrift-calc.js"'));
assert.ok(html.includes(`href="https://afrotools.com${sw}"`));
assert.ok(html.includes('/assets/img/tools/thrift-calc.webp'));
assert.ok(html.includes('fintech-shared-controllers/thrift-calc.js'));
assert.ok(html.includes('href="/sw/ai/?tool=thrift-calc"'));
for (const term of ['Ajo', 'Esusu', 'Susu', 'Tontine', 'Chama', 'Stokvel']) assert.ok(html.includes(term), term);
for (const text of ['Udhamini au ushirika wa kibiashara', 'ridhaa ya wazi', 'Agosti 2026', 'uhakika wa hesabu', 'mchango', 'nafasi']) assert.ok(html.includes(text), text);
assert.ok(html.includes('href="/sw/zana/mfuko-wa-dharura/"'));
assert.ok(!html.includes('href="/sw/zana/kikokotoo-mfuko-wa-dharura/"'));
assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calc|calculate)/i.test(html), 'inline calculator');
assert.ok(!/download\s*=|data-export=|pdf-download-gate|save-result-button/i.test(html), 'advertised export');

for (const paired of ['/tools/thrift-calc/', '/fr/tools/rendement-tontine-cooperative/']) {
  const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
  assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), `reciprocal ${paired}`);
}

console.log('Swahili thrift-calc: immutable 99-row scope and lifecycle-aware route contract passed');
