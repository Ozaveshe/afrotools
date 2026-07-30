'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { buildFrenchAiRouteMap } = require('../scripts/lib/french-ai-route-map');
const { build } = require('../scripts/build-french-religious-cultural-parity');
const engine = require('../assets/js/engines/religious-cultural-parity');
const inventory = require('./support/day10-category-inventory');

const ROOT = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/localization/fr-religious-cultural-parity.json'), 'utf8'));

function routeToFile(route) {
  return path.join(ROOT, String(route).replace(/^\/+|\/+$/g, ''), 'index.html');
}

function defaultInputs(tool) {
  return Object.fromEntries(tool.fields.map((field) => [field.id, String(field.value)]));
}

function assertFixture(tool, values) {
  const serialized = JSON.stringify(values);
  if (tool.fixture.contains) assert(serialized.includes(tool.fixture.contains), `${tool.sourceId} output should contain ${tool.fixture.contains}`);
  for (const [key, expected] of Object.entries(tool.fixture)) {
    if (key === 'contains') continue;
    assert.deepStrictEqual(values[key], expected, `${tool.sourceId}.${key}`);
  }
}

assert.strictEqual(manifest.schemaVersion, 1);
assert.strictEqual(manifest.locale, 'fr');
assert.strictEqual(manifest.category, 'religious-cultural');
assert.strictEqual(manifest.tools.length, 22, 'manifest denominator must be exactly 22');
assert.strictEqual(new Set(manifest.tools.map((tool) => tool.sourceId)).size, 22, 'source owners must be unique');
assert.strictEqual(new Set(manifest.tools.map((tool) => tool.route)).size, 22, 'French routes must be unique');
assert.strictEqual(new Set(manifest.tools.map((tool) => tool.artwork)).size, 22, 'each canonical route requires dedicated artwork');

const englishApps = inventory.getCanonicalEnglishApps().filter((tool) => tool.category === 'religious-cultural');
assert.strictEqual(englishApps.length, 22, 'English registry denominator must remain exactly 22');
assert.deepStrictEqual(
  [...manifest.tools.map((tool) => tool.sourceId)].sort(),
  [...englishApps.map((tool) => tool.id)].sort(),
  'manifest must own every canonical English app exactly once'
);

const registry = inventory.loadRegistry().tools;
for (const tool of manifest.tools) {
  const frenchOwner = registry.find((row) => row.lang === 'fr' && row.sourceId === tool.sourceId && row.href === tool.route);
  assert(frenchOwner, `${tool.sourceId} requires one French registry owner at ${tool.route}`);
  assert.strictEqual(frenchOwner.category, 'religious-cultural');
  assert(['live', 'new'].includes(frenchOwner.status));

  const calculation = engine.calculate(tool.engine, defaultInputs(tool));
  assert.strictEqual(calculation.ok, true, `${tool.sourceId} default fixture must calculate`);
  assertFixture(tool, calculation.values);

  const htmlPath = routeToFile(tool.route);
  assert(fs.existsSync(htmlPath), `${tool.route} must be physical`);
  const html = fs.readFileSync(htmlPath, 'utf8');
  assert(/<html\b[^>]*\blang="fr"/.test(html), `${tool.route} must declare French`);
  assert(html.includes(`data-tool="${tool.sourceId}"`), `${tool.route} must preserve source identity`);
  assert(html.includes(`href="https://afrotools.com${tool.route}"`), `${tool.route} must self-canonicalize`);
  assert(html.includes(`hreflang="en" href="https://afrotools.com${tool.englishRoute}"`), `${tool.route} must link to English`);
  assert(html.includes(`hreflang="fr" href="https://afrotools.com${tool.route}"`), `${tool.route} must link to itself`);
  assert(html.includes('"inLanguage":"fr"'), `${tool.route} needs French schema`);
  assert(html.includes(`content="https://afrotools.com${tool.artwork}"`), `${tool.route} needs dedicated OG artwork`);
  assert(html.includes('content="deterministic-local"'), `${tool.route} needs local AI mode`);
  assert(html.includes('content="required-before-send"'), `${tool.route} needs consent boundary`);
  assert(html.includes('/assets/js/engines/religious-cultural-parity.js'), `${tool.route} needs shared engine`);
  assert(html.includes('/assets/js/pages/fr-religious-cultural-parity.js'), `${tool.route} needs French controller`);
  assert(!/<iframe\b/i.test(html), `${tool.route} must not use an iframe`);
  assert(!/source-launch|Ouvrir le calculateur complet/i.test(html), `${tool.route} must not be a bridge`);
  assert(fs.existsSync(path.join(ROOT, tool.artwork.replace(/^\//, ''))), `${tool.route} artwork must exist`);

  const englishHtml = fs.readFileSync(routeToFile(tool.englishRoute), 'utf8');
  assert(
    englishHtml.includes(`hreflang="fr" href="https://afrotools.com${tool.route}"`),
    `${tool.englishRoute} requires reciprocal French hreflang`
  );
  const otherAlternates = [...englishHtml.matchAll(/<link\b[^>]*\bhreflang=["']([^"']+)["'][^>]*\bhref=["']([^"']+)["'][^>]*>/gi)]
    .filter((match) => !['en', 'fr', 'x-default'].includes(match[1].toLowerCase()));
  for (const alternate of otherAlternates) {
    assert(
      html.includes(`hreflang="${alternate[1]}" href="${alternate[2]}"`),
      `${tool.route} must preserve reciprocal ${alternate[1]} alternate`
    );
  }
}

const hubPath = routeToFile(manifest.hub.route);
assert(fs.existsSync(hubPath), 'native French hub must exist');
const hub = fs.readFileSync(hubPath, 'utf8');
assert.strictEqual((hub.match(/class="fr-rc-tool-link"/g) || []).length, 22, 'hub must expose exactly 22 canonical app links');
assert(hub.includes('"numberOfItems":22'), 'hub schema must declare exact count');
assert(!hub.includes('hreflang="en"'), 'hub stays standalone until other locale hub owners can be updated together');
assert(hub.includes(`hreflang="x-default" href="https://afrotools.com${manifest.hub.route}"`), 'standalone hub x-default must be self-referential');
assert(!/\/fr\/all-tools\/\?category=religious-cultural/.test(hub), 'native hub must not fall back to filtered directory');

const categoryDirectory = fs.readFileSync(path.join(ROOT, 'scripts/lib/french-category-directory.js'), 'utf8');
assert(
  /\{ key: 'religious-cultural',[^\n]+href: '\/fr\/religion-culture\/',[^\n]+nativeHub: true/.test(categoryDirectory),
  'French category directory must own the native hub'
);

const aiMap = buildFrenchAiRouteMap();
for (const tool of manifest.tools) {
  assert.strictEqual(aiMap.routes[tool.englishRoute], tool.route, `${tool.sourceId} AI route must preserve French destination`);
}

assert.doesNotThrow(() => build({ check: true }), 'dedicated generator check mode must be clean');

console.log(JSON.stringify({
  denominator: {
    englishCanonicalApps: englishApps.length,
    frenchManifestOwners: manifest.tools.length,
    physicalFrenchRoutes: manifest.tools.filter((tool) => fs.existsSync(routeToFile(tool.route))).length,
    aiMappedRoutes: manifest.tools.filter((tool) => aiMap.routes[tool.englishRoute] === tool.route).length,
    dedicatedArtwork: new Set(manifest.tools.map((tool) => tool.artwork)).size,
    nativeHubLinks: (hub.match(/class="fr-rc-tool-link"/g) || []).length
  },
  fixtures: manifest.tools.length,
  result: 'PASS'
}, null, 2));
