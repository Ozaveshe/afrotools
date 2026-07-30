'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const engine = require('../engines/src/export-docs-directory-engine');
const fixture = require('./fixtures/export-docs-english-invariants.json');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const contract = require('../scripts/lib/fr-agriculture-singleton-contracts/export-docs');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');
const { normalizeBuildManagedHtml } = require('../scripts/lib/shared-asset-references');

const row = manifest.rows.find(value => value.english.id === 'export-docs');
assert.ok(row);
assertNativeFrenchOutput(manifest, [row.french.route]);
const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
const sourceHtml = normalizeBuildManagedHtml(html);
assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
assert.match(html, /export-docs-directory-engine\.js/);
assert.match(html, /aucune saisie n’est envoyée à un serveur/i);
assert.match(html, /pas une liste officielle ou exhaustive/i);
assert.doesNotMatch(sourceHtml, /\/fr\/agriculture\/export-docs\/(?:algeria|angola|benin)/);
assert.equal(ai.routes[row.english.routeKey], row.french.routeKey);

const context = { window: { AfroTools: {} } };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture/country-index.js'), 'utf8'), context);
const localized = JSON.parse(JSON.stringify(context.window.AfroTools.countryIndex)).map(country => ({
  ...country,
  name: require('../data/registry/countries.json').find(item => item.id === country.code).displayNames.fr,
}));
const directory = engine.buildDirectory(localized, contract.REGION_LABELS, contract.REGION_ORDER);
assert.equal(directory.ok, true);
assert.equal(directory.count, 54);
const profiles = directory.rows.map(country => {
  const selected = engine.select(directory, country.code);
  assert.equal(selected.ok, true);
  assert.equal(selected.country.region, fixture.owner.countries.find(item => item.code === country.code).region);
  assert.deepEqual(selected.country.topCrops, fixture.owner.countries.find(item => item.code === country.code).topCrops);
  assert.equal(engine.search(directory, country.name).rows.some(item => item.code === country.code), true);
  return {
    code: country.code,
    frenchName: country.name,
    region: country.region,
    crops: country.topCrops,
    status: selected.status,
  };
});
const oracle = {
  schemaVersion: 1,
  family: 'singleton:export-docs',
  profiles,
  limitations: [
    'The manifest row accepts the hub only; 54 country checklist subroutes remain outside this programme.',
    'No legal requirement, authority, fee, deadline or live status is asserted by this directory contract.',
  ],
};
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(oracle, null, 2)}\n`);
}
console.log(`PASS ${profiles.length} French Export Documents country directory profiles`);
