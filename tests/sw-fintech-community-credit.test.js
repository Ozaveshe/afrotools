'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const ROOT = path.resolve(__dirname, '..');
const apps = [
  ['sacco-calc', 'sw/zana/kikokotoo-sacco-na-vyama-vya-akiba/index.html', '/sw/zana/kikokotoo-sacco-na-vyama-vya-akiba/', '/tools/sacco-calc/', '/fr/tools/calculateur-sacco-cooperative/'],
  ['credit-score', 'sw/zana/alama-ya-mkopo/index.html', '/sw/zana/alama-ya-mkopo/', '/tools/credit-score/', '/fr/tools/score-credit/']
];
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
const rows = inventory.rows.filter((row) => scope.has(row.categoryKey));

assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length + rows.filter((row) => !accepted.has(row.englishId)).length, 99);
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: apps.map(([id, , sw]) => ({ id, swahiliRoute: sw })) });

for (const [id, file, sw, en, fr] of apps) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  assert.ok(html.includes('lang="sw"'), id);
  assert.ok(html.includes('content="scripts/build-sw-fintech-community-credit.js"'), id);
  assert.ok(html.includes(`href="https://afrotools.com${sw}"`), id);
  assert.ok(html.includes(`/assets/img/tools/${id}.webp`), id);
  assert.ok(html.includes(`fintech-shared-controllers/${id}.js`), id);
  assert.ok(html.includes(`href="/sw/ai/?tool=${id}"`), id);
  assert.ok(html.includes('Udhamini au ushirika wa kibiashara'), id);
  assert.ok(html.includes('ridhaa ya wazi'), id);
  assert.ok(html.includes('Agosti 2026'), id);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calc|calculate)/i.test(html), `${id}: inline calculator`);
  assert.ok(!/download\s*=|data-export=|pdf-download-gate|save-result-button/i.test(html), `${id}: advertised export`);
  for (const paired of [en, fr]) {
    const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), `${id}: reciprocal ${paired}`);
  }
}

console.log('Swahili Fintech community credit: immutable 99-row scope and 2/2 lifecycle-aware route contracts passed');
