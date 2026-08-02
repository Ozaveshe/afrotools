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
  ['sacco-calc', 'sw/zana/kikokotoo-sacco-na-vyama-vya-akiba/index.html', '/sw/zana/kikokotoo-sacco-na-vyama-vya-akiba/', '/tools/sacco-calc/', '/fr/tools/calculateur-sacco-cooperative/'],
  ['credit-score', 'sw/zana/alama-ya-mkopo/index.html', '/sw/zana/alama-ya-mkopo/', '/tools/credit-score/', '/fr/tools/score-credit/']
];
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const accepted = new Set(acceptance.entries.filter((row) => row.status === 'accepted').map((row) => row.englishId));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
const rows = inventory.rows.filter((row) => scope.has(row.categoryKey));

assert.strictEqual(rows.length, 99);
assert.strictEqual(rows.filter((row) => accepted.has(row.englishId)).length, 6);
assert.strictEqual(rows.filter((row) => !accepted.has(row.englishId)).length, 93);

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
  assert.strictEqual(routeEntry.resolveToolRoute(id, routeMap), null, `${id}: central AI acceptance`);
  for (const paired of [en, fr]) {
    const pairedHtml = fs.readFileSync(path.join(ROOT, paired.replace(/^\//, ''), 'index.html'), 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${sw}"`), `${id}: reciprocal ${paired}`);
  }
}

childProcess.execFileSync(process.execPath, [path.join(ROOT, 'scripts/build-sw-fintech-community-credit.js')], { cwd: ROOT, stdio: 'pipe' });
const protectedPaths = ['data/audits/swahili-free-app-acceptance.json', 'assets/js/ai/swahili-route-map.generated.js', 'data/registry/locale-page-coverage.json', 'data/tool-directory.json', 'sitemap.xml', 'dist'];
const drift = childProcess.execFileSync('git', ['diff', '--name-only', BASE, '--', ...protectedPaths], { cwd: ROOT, encoding: 'utf8' }).trim();
assert.strictEqual(drift, '', drift);

console.log('Swahili Fintech community credit: inventory 99/6/93 and 2/2 route contracts passed');
