'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const data = require('../data/agriculture/farm-budget-data.json');
const engine = require('../engines/src/farm-budget-engine');

const ROOT = path.resolve(__dirname, '..');
const row = manifest.rows.find(item => item.english.id === 'farm-budget');
assert(row);
const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
for (const html of [english, french]) {
  assert.match(html, /\/data\/agriculture\/farm-costs\.js/);
  assert.match(html, /\/data\/agriculture\/farm-budget-data\.js/);
  assert.match(html, /\/engines\/farm-budget-engine\.js/);
}
assert.doesNotMatch(english, /var SEED_PRICE_PER_KG = \{/);
assert.doesNotMatch(french, /<iframe\b/i);
for (const label of ['Exporter en PDF', 'Exporter en CSV', 'Exporter en JSON', 'Exporter en TXT']) assert.match(french, new RegExp(label));
assert.match(french, /aucune saisie envoyée à un serveur/i);
assert.match(french, /aucune donnée en direct/i);
assert.ok(english.includes('hreflang="fr" href="https://afrotools.com/fr/agriculture/farm-budget/"'));
assert.equal(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture/farm-costs.js'), 'utf8'), context);
const farmCosts = context.window.AfroTools.farmCosts;
const profiles = [
  { countryCode: 'NG', crops: [{ crop: 'maize', area: 1 }], landMode: 'own', laborMode: 'family', mechanizationMode: 'manual', financeMode: 'cash', startMonth: 4 },
  { countryCode: 'SN', crops: [{ crop: 'groundnut', area: 2.5 }, { crop: 'millet', area: 1 }], landMode: 'rent', rentOverride: 30000, laborMode: 'mixed', mechanizationMode: 'ox', financeMode: 'loan', loanRate: 9, loanTerm: 6, startMonth: 6 },
  { countryCode: 'KE', crops: [{ crop: 'tomato', area: 0.75 }], landMode: 'rent', laborMode: 'hired', mechanizationMode: 'tractor', financeMode: 'loan', startMonth: 3 },
];
const oracles = profiles.map(profile => ({ profile, result: engine.calculate(profile, { data, farmCosts }) }));
oracles.forEach(oracle => assert.equal(oracle.result.ok, true));
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify({
    family: 'singleton:farm-budget',
    rows: 1,
    exhaustiveEngineScenarios: 8748,
    profiles: oracles,
  }, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: 'singleton:farm-budget', rows: 1, profiles: profiles.length }, null, 2));
