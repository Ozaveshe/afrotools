'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const { spawnSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const engine = require('../assets/js/engines/fr-mining-parity');
const fixture = require('./fixtures/fr-mining-parity.json');
const { frenchRouteForEnglishToolSource } = require('../scripts/lib/french-tool-route-map');

const APP_IDS = Object.keys(fixture.apps);

function closeTo(actual, expected, label) {
  const tolerance = Math.max(1e-7, Math.abs(expected) * 1e-9);
  assert(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

function assertExpected(actual, expected, id) {
  assert.equal(actual.ok, true, `${id} should calculate`);
  for (const [key, value] of Object.entries(expected)) {
    closeTo(actual[key], value, `${id}.${key}`);
  }
}

function jsonLd(html) {
  return [...html.matchAll(/<script\b[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((match) => JSON.parse(match[1]));
}

test('frozen English Mining fixtures are reproduced by the shared DOM-free engine', () => {
  const apps = fixture.apps;
  assertExpected(engine.diamond(apps['diamond-valuation'].inputs), apps['diamond-valuation'].expected, 'diamond-valuation');
  assertExpected(engine.oilWell(apps['oil-well-production'].inputs), apps['oil-well-production'].expected, 'oil-well-production');
  assertExpected(engine.oilGas(apps['oil-gas-revenue'].inputs), apps['oil-gas-revenue'].expected, 'oil-gas-revenue');
  assertExpected(
    engine.licence(
      apps['mining-license-fee'].inputs,
      { symbol: '₦' },
      { annualBasis: 'perKm2', oneOffBasis: 'flat' }
    ),
    apps['mining-license-fee'].expected,
    'mining-license-fee'
  );
  assertExpected(
    engine.royalty(apps['mining-royalty'].inputs, { symbol: 'TZS', extraLevyPct: 1 }),
    apps['mining-royalty'].expected,
    'mining-royalty'
  );
  assertExpected(engine.artisanal(apps['artisanal-mining-income'].inputs), apps['artisanal-mining-income'].expected, 'artisanal-mining-income');
});

test('missing licence fees fail closed instead of being coerced to zero', () => {
  const result = engine.licence(
    { area: 2, years: 5, oneOff: 600000, annual: null },
    { symbol: '₦' },
    { annualBasis: 'perKm2', oneOffBasis: 'flat' }
  );
  assert.deepEqual(result, { ok: false, field: 'annual', code: 'missing_fee' });
});

test('all six physical French routes are mapped, native, reciprocal and independently illustrated', () => {
  const registry = fs.readFileSync(path.join(ROOT, 'assets/js/components/tool-registry.js'), 'utf8');
  const artwork = new Set();

  for (const [id, app] of Object.entries(fixture.apps)) {
    const route = app.frenchRoute;
    const relative = route.replace(/^\/+/, '');
    const html = fs.readFileSync(path.join(ROOT, relative, 'index.html'), 'utf8');
    const englishHtml = fs.readFileSync(path.join(ROOT, app.englishRoute.replace(/^\/+/, ''), 'index.html'), 'utf8');
    const imagePath = `assets/img/tools/${id}.webp`;

    assert.equal(
      `${frenchRouteForEnglishToolSource(app.englishRoute)}/`,
      app.frenchRoute,
      `${id} route mapping`
    );
    const registryRow = registry.split(/\r?\n/).find((line) => line.includes(`href: '${app.frenchRoute}'`));
    assert(registryRow, `${id} French registry row`);
    assert.match(registryRow, new RegExp(`sourceId:\\s*'${id}'`));
    assert.match(registryRow, new RegExp(`imageId:\\s*'${id}'`));
    assert.match(html, /<html\b[^>]*\blang="fr"/);
    assert.match(html, new RegExp(`<link rel="canonical" href="https://afrotools\\.com${route}"`));
    assert.match(html, new RegExp(`hreflang="en" href="https://afrotools\\.com${app.englishRoute}"`));
    const graph = jsonLd(html).flatMap((schema) => schema['@graph'] || [schema]);
    const webApp = graph.find((schema) => schema['@type'] === 'WebApplication');
    assert.ok(webApp, `${id} WebApplication schema`);
    assert.equal(webApp.inLanguage, 'fr', `${id} schema language`);
    assert.match(html, /Confidentialité locale/);
    assert.match(html, /Télécharger le rapport PDF/);
    assert.equal((html.match(/form="mining-form" required/g) || []).length, 3, `${id} evidence controls`);
    assert.match(html, /Ces trois champs sont obligatoires/);
    assert.doesNotMatch(html, /<iframe\b|handoff|coming soon/i);
    assert.match(englishHtml, new RegExp(`hreflang="fr" href="https://afrotools\\.com${route}"`));
    assert(fs.existsSync(path.join(ROOT, imagePath)), `${id} artwork must exist`);
    assert(fs.statSync(path.join(ROOT, imagePath)).size > 50_000, `${id} artwork must be substantive`);
    artwork.add(imagePath);
  }

  assert.equal(artwork.size, APP_IDS.length);
});

test('focused French Mining owner output is current and the hub contains exactly six app routes', () => {
  const result = spawnSync(process.execPath, ['scripts/generate-fr-mining-parity.js', '--check'], {
    cwd: ROOT,
    encoding: 'utf8'
  });
  assert.equal(result.status, 0, result.stderr || result.stdout);

  const hub = fs.readFileSync(path.join(ROOT, 'fr/mining/index.html'), 'utf8');
  const linkedApps = [...hub.matchAll(/href="(\/fr\/tools\/[^"]+\/)"/g)].map((match) => match[1]);
  assert.deepEqual([...new Set(linkedApps)].sort(), APP_IDS.map((id) => fixture.apps[id].frenchRoute).sort());
  const graph = jsonLd(hub).flatMap((schema) => schema['@graph'] || [schema]);
  const collection = graph.find((schema) => schema['@type'] === 'CollectionPage');
  assert.ok(collection, 'French Mining CollectionPage schema');
  assert.equal(collection.mainEntity.numberOfItems, 6);
});
