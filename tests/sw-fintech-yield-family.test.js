'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const ROOT = path.resolve(__dirname, '..');
const apps = [
  ['bond-yield', 'sw/zana/mavuno-ya-hatifungani/index.html', '/sw/zana/mavuno-ya-hatifungani/', '/tools/bond-yield/', '/fr/tools/rendement-obligations/'],
  ['money-market', 'sw/zana/kilinganisha-mfuko-wa-soko-la-fedha/index.html', '/sw/zana/kilinganisha-mfuko-wa-soko-la-fedha/', '/tools/money-market/', '/fr/tools/comparateur-fonds-monetaires/'],
];
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
const rows = inventory.rows.filter((row) => scope.has(row.categoryKey));
assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length + rows.filter((row) => !accepted.has(row.englishId)).length, 99);
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: apps.map(([id,,swahiliRoute]) => ({ id, swahiliRoute })) });

for (const [id, file, sw, en, fr] of apps) {
  const html = fs.readFileSync(path.join(ROOT, file), 'utf8');
  assert.ok(html.includes('lang="sw"'), id);
  assert.ok(html.includes('content="scripts/build-sw-fintech-yield-family.js"'), id);
  assert.ok(html.includes(`href="https://afrotools.com${sw}"`), id);
  assert.ok(html.includes(`/assets/img/tools/${id}.webp`), id);
  assert.ok(html.includes(`fintech-shared-controllers/${id}.js`), id);
  assert.ok(html.includes(`href="/sw/ai/?tool=${id}"`), id);
  assert.ok(html.includes('Udhamini au ushirika wa kibiashara haubadilishi fomula'), id);
  assert.ok(html.includes('Hakuna kiasi, mtoa huduma au chaguo la uwekezaji'), id);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calc|calculate)/i.test(html), `${id}: inline`);
  for (const paired of [en, fr]) {
    const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), `${id}:${paired}`);
  }
}
assert.ok(!/download\s*=|data-export=|pdf-download-gate/i.test(fs.readFileSync(path.join(ROOT, apps[0][1]), 'utf8')), 'bond export');
assert.ok(fs.readFileSync(path.join(ROOT, apps[1][1]), 'utf8').includes('id="mmf-copy"'), 'money-market copy');

process.stdout.write('Swahili Fintech yield family: immutable 99-row scope and 2/2 lifecycle-aware route contracts passed\n');
