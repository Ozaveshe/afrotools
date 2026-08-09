'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { apps } = require('../scripts/build-sw-fintech-savings-family');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');
const { assertLifecycle } = require('./support/swahili-acceptance-lifecycle');

const ROOT = path.resolve(__dirname, '..');
const inventory = JSON.parse(fs.readFileSync(path.join(ROOT, 'reports/swahili-free-app-parity-inventory.json'), 'utf8'));
const acceptance = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/audits/swahili-free-app-acceptance.json'), 'utf8'));
const scope = new Set(['small-business', 'fintech', 'transport', 'trade']);
assert.strictEqual(inventory.rows.filter((row) => scope.has(row.categoryKey)).length, 99, 'immutable allocated denominator');
assert.deepStrictEqual(apps.map((app) => app.id), ['fixed-deposit', 'tbill-calc', 'real-return'], 'immutable family IDs');
assertLifecycle({ inventory, acceptance, routeEntry, routeMap, apps: apps.map((app) => ({ id: app.id, swahiliRoute: `/sw/zana/${app.slug}/` })) });

for (const app of apps) {
  const swRoute = `/sw/zana/${app.slug}/`;
  const swFile = path.join(ROOT, 'sw', 'zana', app.slug, 'index.html');
  const html = fs.readFileSync(swFile, 'utf8');
  assert.ok(html.includes(`lang="sw"`), app.id);
  assert.ok(html.includes(`content="scripts/build-sw-fintech-savings-family.js"`), app.id);
  assert.ok(html.includes(`href="https://afrotools.com${swRoute}"`), app.id);
  assert.ok(html.includes(`src="${app.og}"`), app.id);
  assert.ok(html.includes(app.controller), app.id);
  assert.ok(html.includes(`href="/sw/ai/?tool=${app.id}"`), app.id);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calc|calculate)/i.test(html), `${app.id}: generic inline calculator`);
  assert.ok(!/data-export=|download\s*=|pdf-download-gate/i.test(html), `${app.id}: unproved export advertising`);

  for (const paired of [app.english, app.french]) {
    const file = path.join(ROOT, paired.replace(/^\//, ''), 'index.html');
    const pairedHtml = fs.readFileSync(file, 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${swRoute}"`), `${app.id}: ${paired}`);
  }
}

process.stdout.write('Swahili Fintech savings family: immutable 99-row scope and 3/3 lifecycle-aware route contracts passed\n');
