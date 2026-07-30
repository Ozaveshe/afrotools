'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const engine = require('../engines/src/poultry-roi-engine');
const contract = require('../scripts/lib/fr-agriculture-singleton-contracts/poultry-roi-calculator');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

const row = manifest.rows.find(item => item.english.id === 'poultry-roi-calculator');
assert.ok(row, 'Poultry ROI manifest row');
assert.equal(row.family, 'singleton');
assert.equal(row.french.route, '/fr/agriculture/poultry-roi/');
assert.equal(contract.COUNTRY_CODES.length, 15);
assert.equal(new Set(contract.COUNTRY_CODES).size, 15);
assertNativeFrenchOutput(manifest, [row.french.route]);

const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
assert.doesNotMatch(html, /<iframe\b/i);
assert.doesNotMatch(html, /\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i);
assert.match(html, /<html\b[^>]*\blang="fr"/);
assert.match(html, /\/data\/agriculture\/poultry-data\.js/);
assert.match(html, /\/engines\/poultry-roi-engine\.js/);
assert.match(html, /Exporter en PDF/);
assert.match(html, /Exporter en CSV/);
assert.match(html, /Exporter en JSON/);
assert.match(html, /Exporter en TXT/);
assert.match(html, /aucune saisie envoyée à un serveur/i);
assert.equal(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);

const context = { window: {} };
vm.createContext(context);
vm.runInContext(
  fs.readFileSync(path.join(ROOT, 'data/agriculture/poultry-data.js'), 'utf8'),
  context
);
const production = context.window.AfroTools.PoultryProduction;
const costs = context.window.AfroTools.PoultryCosts;
const profiles = [];
for (const countryCode of contract.COUNTRY_CODES) {
  assert.ok(costs[countryCode], `missing PoultryCosts country ${countryCode}`);
  for (const mode of ['broilers', 'layers', 'indigenous', 'compare']) {
    const input = {
      mode,
      countryCode,
      flockSize: 325,
      management: 'semi_commercial',
      cyclesPerYear: 5,
      ownHouse: false,
      housingType: 'semi_commercial',
    };
    const output = engine.calculate(input, costs[countryCode], production);
    assert.equal(output.mode, mode);
    assert.equal(output.error, undefined);
    profiles.push({ countryCode, mode, input, output });
  }
}

const oracle = {
  schemaVersion: 1,
  family: 'singleton:poultry-roi-calculator',
  countries: contract.COUNTRY_CODES,
  modes: ['broilers', 'layers', 'indigenous', 'compare'],
  profiles,
};
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(
    path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT),
    `${JSON.stringify(oracle, null, 2)}\n`,
    'utf8'
  );
}

console.log(JSON.stringify({
  family: oracle.family,
  rows: 1,
  countries: oracle.countries.length,
  profiles: profiles.length,
}, null, 2));
