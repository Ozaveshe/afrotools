'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'data/localization/fr-climate-parity-manifest.json'), 'utf8'));
const aiMap = require(path.join(root, 'assets/js/ai/french-route-map.generated.js'));
const { PAGES: genericGapPages } = require(path.join(root, 'scripts/generate-fr-tool-gap-pages.js'));
const genericGapRoutes = new Set(genericGapPages.map((page) => `/fr/tools/${page.frSlug}/`));

assert.equal(manifest.categoryKey, 'climate');
assert.equal(manifest.routes.length, 13);
assert.equal(new Set(manifest.routes.map((row) => row.toolId)).size, 13);
assert.equal(new Set(manifest.routes.map((row) => row.english)).size, 13);
assert.equal(new Set(manifest.routes.map((row) => row.french)).size, 13);

for (const row of manifest.routes) {
  const english = fs.readFileSync(path.join(root, row.english.replace(/^\//, ''), 'index.html'), 'utf8');
  const french = fs.readFileSync(path.join(root, row.french.replace(/^\//, ''), 'index.html'), 'utf8');
  assert.match(english, /window\.AfroClimateToolConfig=/, `${row.toolId}: missing English owner config`);
  assert.match(french, new RegExp(`data-fr-climate-tool="${row.toolId}"`), `${row.toolId}: wrong French owner`);
  assert.match(french, /\/assets\/js\/climate-tools\.js/, `${row.toolId}: shared engine missing`);
  assert.match(french, /\/assets\/js\/pages\/fr-climate-tools\.js/, `${row.toolId}: French controller missing`);
  assert.doesNotMatch(french, /<iframe|Continue in English|Open the full English/i, `${row.toolId}: bridge residue`);
  assert.match(french, new RegExp(`<link rel="canonical" href="https://afrotools.com${row.french}"`));
  assert.match(french, new RegExp(`hreflang="en" href="https://afrotools.com${row.english}"`));
  assert.match(french, /hreflang="fr"/);
  assert.match(french, /Estimation de planification, confiance faible/);
  assert.match(french, /aucune donnée n’est récupérée en direct/);
  assert.equal((french.match(/Référence méthodologique/g) || []).length, 3, `${row.toolId}: source count`);
  assert.ok(fs.existsSync(path.join(root, row.artwork.replace(/^\//, ''))), `${row.toolId}: artwork missing`);
  assert.equal(aiMap.routes[row.english], row.french, `${row.toolId}: French AI route mismatch`);
}

const hub = fs.readFileSync(path.join(root, 'fr/climat-environnement/index.html'), 'utf8');
assert.match(hub, /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/climat-environnement\/">/);
assert.equal((hub.match(/class="fr-climate-hub-link"/g) || []).length, 13);
assert.match(fs.readFileSync(path.join(root, 'climate/index.html'), 'utf8'), /hreflang="fr" href="https:\/\/afrotools\.com\/fr\/climat-environnement\/"/);

const registry = fs.readFileSync(path.join(root, 'assets/js/components/tool-registry.js'), 'utf8');
for (const alias of manifest.excludedAliases) {
  assert.equal(genericGapRoutes.has(alias), false, `${alias}: generic gap generator must not overwrite the noindex alias`);
  assert.doesNotMatch(registry, new RegExp(`href: "${alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`), `${alias}: duplicate registry owner`);
  const aliasHtml = fs.readFileSync(path.join(root, alias.replace(/^\//, ''), 'index.html'), 'utf8');
  assert.match(aliasHtml, /name="robots" content="noindex,follow"/);
  assert.match(aliasHtml, /rel="canonical" href="https:\/\/afrotools\.com\/fr\/tools\/(?:revenus-credits-carbone|risque-inondation)\//);
}

console.log('French Climate parity contract: 13/13 native routes passed.');
