'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const childProcess = require('child_process');
const { buildManifest } = require('../scripts/build-sw-business-fintech-trade-transport-manifest');
const { apps, build } = require('../scripts/build-sw-fintech-savings-family');
const routeEntry = require('../assets/js/pages/sw-ai-route-entry');
const routeMap = require('../assets/js/ai/swahili-route-map.generated');

const ROOT = path.resolve(__dirname, '..');
const BASE = '6edacda8437e1fa9b9e5a512138cbdd3169e38be';

const manifest = buildManifest();
assert.strictEqual(manifest.totals.allocated, 99);
assert.strictEqual(manifest.totals.excludedAccepted, 8);
assert.strictEqual(manifest.totals.remainingUnaccepted, 91);
assert.deepStrictEqual(
  manifest.excludedAccepted.map((row) => row.englishId).sort(),
  ['b2b-payment', 'bill-split', 'bol-generator', 'cross-border-data', 'customs-time', 'packing-list', 'proforma-invoice', 'shipping-weight'].sort()
);
assert.deepStrictEqual(manifest.selectedFamily.rows.map((row) => row.englishId), apps.map((app) => app.id));
assert.strictEqual(build(false), 3);

for (const app of apps) {
  const swRoute = `/sw/zana/${app.slug}/`;
  const swFile = path.join(ROOT, 'sw', 'zana', app.slug, 'index.html');
  const html = fs.readFileSync(swFile, 'utf8');
  assert.ok(html.includes(`lang="sw"`), app.id);
  assert.ok(html.includes(`content="scripts/build-sw-fintech-savings-family.js"`), app.id);
  assert.ok(html.includes(`href="https://afrotools.com${swRoute}"`), app.id);
  assert.ok(html.includes(`src="${app.og}"`), app.id);
  assert.ok(html.includes(`src="${app.controller}"`), app.id);
  assert.ok(html.includes(`href="/sw/ai/?tool=${app.id}"`), app.id);
  assert.ok(!/<script[^>]*>[\s\S]*function\s+(?:calc|calculate)/i.test(html), `${app.id}: generic inline calculator`);
  assert.ok(!/data-export=|download\s*=|pdf-download-gate/i.test(html), `${app.id}: unproved export advertising`);
  assert.strictEqual(routeEntry.resolveToolRoute(app.id, routeMap), null, `${app.id}: candidate must stay out of central AI map`);

  for (const paired of [app.english, app.french]) {
    const file = path.join(ROOT, paired.replace(/^\//, ''), 'index.html');
    const pairedHtml = fs.readFileSync(file, 'utf8');
    assert.ok(pairedHtml.includes(`hreflang="sw" href="https://afrotools.com${swRoute}"`), `${app.id}: ${paired}`);
  }
}

const protectedPaths = [
  'data/audits/swahili-free-app-acceptance.json',
  'assets/js/ai/swahili-route-map.generated.js',
  'sitemap.xml',
  'dist'
];
const protectedDiff = childProcess.execFileSync(
  'git', ['diff', '--name-only', BASE, '--', ...protectedPaths], { cwd: ROOT, encoding: 'utf8' }
).trim();
assert.strictEqual(protectedDiff, '', `protected path drift:\n${protectedDiff}`);

process.stdout.write('Swahili Fintech savings family: manifest 99/6/93 and 3/3 route contracts passed\n');
