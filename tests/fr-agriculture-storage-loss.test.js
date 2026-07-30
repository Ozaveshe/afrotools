'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

const row = manifest.rows.find(item => item.english.id === 'storage-loss');
assert.ok(row);
assertNativeFrenchOutput(manifest, [row.french.route]);
const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
assert.doesNotMatch(html, /<iframe\b/i);
assert.doesNotMatch(html, /\bfetch\s*\(/i);
assert.match(html, /<html\b[^>]*\blang="fr"/);
assert.match(html, /storage-data\.js/);
assert.match(html, /storage-loss-engine\.js/);
assert.match(html, /Exporter en PDF/);
assert.match(html, /aucune saisie envoyée à un serveur/i);
assert.match(html, /aucun prix de marché, taux de change ou relevé de stock en direct/i);
assert.equal(ai.routes[row.english.routeKey], row.french.routeKey);

const context = { window: {} };
vm.createContext(context);
for (const file of ['data/agriculture/storage-data.js', 'engines/src/storage-loss-engine.js']) {
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
}
const data = context.STORAGE_DATA;
const engine = context.window.AfroTools.StorageLossEngine;
const profiles = [];
const countryCodes = Object.keys(data.countries).filter(code => data.countries[code]);
for (const [crop, cropData] of Object.entries(data.lossRates)) {
  for (const methodKey of Object.keys(cropData.methods)) {
    for (let index = 0; index < countryCodes.length; index += 1) {
      const countryCode = countryCodes[index];
      const country = data.countries[countryCode];
      const quantityTonnes = [0.1, 0.5, 1, 5, 27.4][index % 5];
      const durationMonths = [1, 4, 6, 9, 12, 18][index % 6];
      const pricePerTonne = (data.harvestPrices[countryCode] && data.harvestPrices[countryCode][crop])
        || cropData.defaultHarvestPrice_USD * country.rate;
      const input = { crop, countryCode, methodKey, quantityTonnes, durationMonths, pricePerTonne };
      const output = engine.calculate(input, data);
      assert.equal(output.ok, true);
      assert.equal(output.country.name, country.name);
      assert.equal(output.input.countryCode, countryCode);
      assert.ok(Number.isFinite(output.totalBenefit));
      profiles.push({ input, output });
    }
  }
}
assert.equal(engine.calculate({
  crop: 'unknown', countryCode: 'ALL', methodKey: 'traditional',
  quantityTonnes: 1, durationMonths: 6, pricePerTonne: 200,
}, data).status, 'invalid-input');

const oracle = {
  schemaVersion: 1,
  family: 'singleton:storage-loss',
  countries: countryCodes,
  crops: Object.keys(data.lossRates),
  profiles,
};
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(ROOT, process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(oracle, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({
  family: oracle.family,
  rows: 1,
  countries: countryCodes.length,
  crops: oracle.crops.length,
  profiles: profiles.length,
}, null, 2));
