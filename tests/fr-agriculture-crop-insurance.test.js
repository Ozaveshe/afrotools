'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const engine = require('../engines/src/crop-insurance-hub-engine');
const fixture = require('./fixtures/crop-insurance-hub-english-invariants.json');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const contract = require('../scripts/lib/fr-agriculture-singleton-contracts/crop-insurance');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');
const { normalizeBuildManagedHtml } = require('../scripts/lib/shared-asset-references');

const row = manifest.rows.find(value => value.english.id === 'crop-insurance');
assert.ok(row);
assertNativeFrenchOutput(manifest, [row.french.route]);
const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
const sourceHtml = normalizeBuildManagedHtml(html);
assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
assert.match(html, /crop-insurance-hub-engine\.js/);
assert.match(html, /aucune saisie envoyée à un serveur/i);
assert.match(html, /pas un devis, une recommandation, une éligibilité ni une estimation d’indemnité/i);
assert.doesNotMatch(sourceHtml, /\/fr\/agriculture\/crop-insurance\/(?:angola|cameroon|nigeria)/);
assert.equal(ai.routes[row.english.routeKey], row.french.routeKey);
assert.equal(contract.COVERED.length, 15);

const profiles = fixture.calculations.map(profile => {
  const output = engine.calculate(profile.input);
  assert.equal(output.premium, profile.input.farmValue * profile.input.premiumRate / 100);
  assert.equal(output.retainedExcess, profile.input.farmValue * profile.input.excess / 100);
  return { input: profile.input, output };
});
const oracle = {
  schemaVersion: 1,
  family: 'singleton:crop-insurance',
  profiles,
  countryContexts: contract.COVERED.map(code => ({ code, frenchName: contract.COUNTRY_NAMES[code] })),
  limitations: [
    'Country programme data is static context and does not set the generic calculator rate or result.',
    'The manifest row accepts only the hub; 15 country subroutes remain outside this acceptance.',
  ],
};
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(oracle, null, 2)}\n`);
}
console.log(`PASS ${profiles.length} French Crop Insurance profiles and ${oracle.countryContexts.length} country contexts`);
