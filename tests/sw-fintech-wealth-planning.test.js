'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const ROOT = path.resolve(__dirname, '..');
const apps = [
  { id: 'fire-calc', sw: '/sw/zana/kikokotoo-fire/', en: '/tools/fire-calc/', fr: '/fr/tools/calculateur-fire/', controller: 'fire-calc.js', markers: ['id="fire-source-date"', 'id="fire-source"', 'id="fire-withdrawal"'] },
  { id: 'property-vs-stocks', sw: '/sw/zana/mali-dhidi-ya-hisa/', en: '/tools/property-vs-stocks/', fr: '/fr/tools/immobilier-vs-actions/', controller: 'property-vs-stocks.js', markers: ['id="pvs-market"', 'id="pvs-source-date"', 'id="pv-sale-cost"'] },
  { id: 'stock-portfolio', sw: '/sw/zana/ufuatiliaji-wa-hisa/', en: '/tools/stock-portfolio/', fr: '/fr/tools/suivi-portefeuille-actions/', controller: 'stock-portfolio.js', markers: ['id="sp-broker"', 'id="sp-source-date"', 'id="holdings-tbody"'] }
];
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
const rows = inventory.rows.filter((row) => scope.has(row.categoryKey));

assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length + rows.filter((row) => !accepted.has(row.englishId)).length, 99);
assert.strictEqual(inventory.rows.filter((row) => row.categoryKey === 'fintech').length, 31);
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: apps.map((app) => ({ id: app.id, swahiliRoute: app.sw })) });

for (const app of apps) {
  const html = fs.readFileSync(path.join(ROOT, app.sw.replace(/^\//, ''), 'index.html'), 'utf8');
  for (const fragment of [
    'lang="sw"', `content="scripts/build-sw-fintech-wealth-planning.js"`,
    `fintech-shared-controllers/${app.controller}`, `/assets/img/tools/${app.id}.webp`,
    `href="/sw/ai/?tool=${app.id}"`, 'Udhamini au ushirika wa kibiashara',
    'ridhaa ya wazi', 'Mbinu ilikaguliwa Agosti 2026', 'uhakika wa juu', ...app.markers
  ]) assert.ok(html.includes(fragment), `${app.id}: ${fragment}`);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calcFIRE|calcPvS|calcPortfolio)/i.test(html), `${app.id}: inline calculator`);
  assert.ok(!/data-export|data-sw-copy|data-sw-download|pdf-download-gate|email-gate-modal/i.test(html), `${app.id}: unowned export`);
  for (const paired of [app.en, app.fr]) {
    const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${app.sw}"`), `${app.id}: reciprocal ${paired}`);
  }
  const frSource = fs.readFileSync(path.join(ROOT, 'data/localization/fr-fintech-banking-pages', `${app.id}.html`), 'utf8');
  assert.ok(frSource.includes(`hreflang="sw" href="https://afrotools.com${app.sw}"`), `${app.id}: French source reciprocal`);
}

console.log('Swahili wealth planning: immutable 99-row scope, Fintech 31, and 3/3 lifecycle-aware route contracts passed');
