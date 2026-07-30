'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

const row = manifest.rows.find(item => item.english.id === 'crop-rotation-planner');
assert.ok(row);
assertNativeFrenchOutput(manifest, [row.french.route]);
const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
assert.doesNotMatch(html, /<iframe\b/i);
assert.doesNotMatch(html, /\bfetch\s*\(/i);
assert.match(html, /<html\b[^>]*\blang="fr"/);
assert.match(html, /country-index\.js/);
assert.match(html, /crop-rotation-engine\.js/);
assert.match(html, /Exporter en PDF/);
assert.match(html, /aucune saisie envoyée à un serveur/i);
assert.equal(ai.routes[row.english.routeKey], row.french.routeKey);

const context = { window: {} };
vm.createContext(context);
for (const file of ['data/agriculture/country-index.js', 'engines/src/crop-rotation-engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
}
const countries = context.window.AfroTools.countryIndex;
const engine = context.window.AfroTools.CropRotationEngine;
const profiles = [];
const goals = ['maximize_yield', 'restore_soil', 'minimize_pests', 'maximize_profit'];
const soils = ['depleted', 'average', 'good', 'excellent'];
for (const [countryIndex, country] of countries.entries()) {
  const availableCrops = engine.getAvailableCrops(country.topCrops);
  for (let index = 0; index < 8; index += 1) {
    const input = {
      countryCode: country.code,
      prevCrop: availableCrops[(countryIndex + index) % availableCrops.length],
      seasons: [2, 3, 4, 6, 8][index % 5],
      goal: goals[index % goals.length],
      soilCondition: soils[(countryIndex + index) % soils.length],
      availableCrops,
    };
    const output = engine.calculate(input);
    assert.equal(output.success, true);
    assert.equal(output.sequence.length, input.seasons);
    assert.ok(output.sequence.every(item => availableCrops.includes(item.crop)));
    profiles.push({ input, output });
  }
}
const oracle = { schemaVersion:1, family:'singleton:crop-rotation-planner', countries:countries.map(country => country.code), crops:engine.getAllCrops().map(crop => crop.id), profiles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) fs.writeFileSync(path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(oracle, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ family:oracle.family, rows:1, countries:oracle.countries.length, crops:oracle.crops.length, profiles:profiles.length }, null, 2));
