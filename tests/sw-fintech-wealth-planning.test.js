'use strict';

const assert = require('assert');
const childProcess = require('child_process');
const fs = require('fs');
const path = require('path');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');

const ROOT = path.resolve(__dirname, '..');
const BASE = '8354e321ff34caf60a33a3393cd0dcddfb00c023';
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
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length, 6);
assert.strictEqual(rows.filter((row) => !accepted.has(row.englishId)).length, 93);
assert.strictEqual(inventory.rows.filter((row) => row.categoryKey === 'fintech').length, 31);

for (const app of apps) {
  const baseRow = rows.find((row) => row.englishId === app.id);
  assert.ok(baseRow && baseRow.state === 'missing' && !accepted.has(app.id), `${app.id} must be missing and centrally unaccepted`);
  const html = fs.readFileSync(path.join(ROOT, app.sw.replace(/^\//, ''), 'index.html'), 'utf8');
  for (const fragment of [
    'lang="sw"', `content="scripts/build-sw-fintech-wealth-planning.js"`,
    `fintech-shared-controllers/${app.controller}`, `/assets/img/tools/${app.id}.webp`,
    `href="/sw/ai/?tool=${app.id}"`, 'Udhamini au ushirika wa kibiashara',
    'ridhaa ya wazi', 'Mbinu ilikaguliwa Agosti 2026', 'uhakika wa juu', ...app.markers
  ]) assert.ok(html.includes(fragment), `${app.id}: ${fragment}`);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calcFIRE|calcPvS|calcPortfolio)/i.test(html), `${app.id}: inline calculator`);
  assert.ok(!/data-export|data-sw-copy|data-sw-download|pdf-download-gate|email-gate-modal/i.test(html), `${app.id}: unowned export`);
  assert.strictEqual(routeEntry.resolveToolRoute(app.id, routeMap), null, `${app.id}: central AI acceptance`);
  for (const paired of [app.en, app.fr]) {
    const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${app.sw}"`), `${app.id}: reciprocal ${paired}`);
  }
  const frSource = fs.readFileSync(path.join(ROOT, 'data/localization/fr-fintech-banking-pages', `${app.id}.html`), 'utf8');
  assert.ok(frSource.includes(`hreflang="sw" href="https://afrotools.com${app.sw}"`), `${app.id}: French source reciprocal`);
}

childProcess.execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-sw-fintech-wealth-planning.js')], { cwd: ROOT, stdio: 'pipe' });
const protectedPaths = ['data/audits/swahili-free-app-acceptance.json', 'assets/js/ai/swahili-route-map.generated.js', 'data/registry/locale-page-coverage.json', 'data/tool-directory.json', 'sitemap.xml', 'dist'];
const drift = childProcess.execFileSync('git', ['diff', '--name-only', BASE, '--', ...protectedPaths], { cwd: ROOT, encoding: 'utf8' }).trim();
assert.strictEqual(drift, '', drift);

console.log('Swahili wealth planning: inventory 99/6/93, Fintech 31, and 3/3 source-owned route contracts passed');
