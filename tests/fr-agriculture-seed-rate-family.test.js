'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

function runtime(countryCode) {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  [
    `data/agriculture/${countryCode.toLowerCase()}-agri-data.js`,
    'data/agriculture/seed-data.js',
    'engines/seed-rate-engine.js',
    'data/agriculture/seed-data-extension.js',
  ].forEach((file) => vm.runInContext(
    fs.readFileSync(path.join(ROOT, file), 'utf8'),
    sandbox,
    { filename: file },
  ));
  return sandbox.window.AfroTools;
}

const rows = manifest.rows.filter((row) => row.family === 'seed-rate');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const oracles = {};

assert.strictEqual(rows.length, 55);
assert.strictEqual(countries.length, 54);
assertNativeFrenchOutput(manifest, rows.map((row) => row.french.route));
assert.strictEqual(
  (fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8').match(/<li><a href="\/fr\/agriculture\/seed-rate\//g) || []).length,
  54,
);

for (const row of countries) {
  const code = row.country.code;
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const englishHtml = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const afroTools = runtime(code);
  const countryData = afroTools.countryData;
  const seedData = afroTools.seedData;
  const crop = countryData.crops.find((item) => seedData[item.id]);

  assert.ok(crop, `${code} has no country crop represented by the accepted seed data owner`);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.match(html, /\/engines\/seed-rate-engine\.js/);
  assert.match(html, /\/data\/agriculture\/seed-data-extension\.js/);
  assert.ok(englishHtml.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.strictEqual(ai.routes[row.english.routeKey], row.french.routeKey);

  const cropData = seedData[crop.id];
  const override = (cropData.countryOverrides && cropData.countryOverrides[code]) || {};
  const spacing = override.spacing || cropData.defaultSpacing || {};
  const input = {
    cropId: crop.id,
    farmSizeHa: countryData.agriStats.avgFarmSizeHa || 1,
    seedQuality: 'improved',
    fieldConditions: 'average',
    intercrop: 'sole',
    plantingMethod: override.method || (cropData.plantingMethod && cropData.plantingMethod[0]) || 'drilling',
    rowSpacing_cm: spacing.row_cm || 100,
    plantSpacing_cm: spacing.plant_cm === 'continuous' ? 10 : spacing.plant_cm || 100,
    seedsPerHole: override.seedsPerHole || cropData.seedsPerHole || 1,
  };
  const result = afroTools.SeedRateEngine.calculate(input, seedData, code, countryData);

  assert.ok(!result.error, `${code} accepted engine returned an error`);
  assert.strictEqual(result.countryCode, code);
  if (result.propagation === 'seed') {
    assert.ok(Number.isFinite(result.totalSeedKg) && result.totalSeedKg > 0);
    assert.strictEqual(result.currency, countryData.currency);
  } else {
    assert.ok(Number.isFinite(result.totalPlants) && result.totalPlants > 0);
  }
  if (crop.id === 'tomato') assert.strictEqual(result.numBags, null);

  oracles[code] = {
    input,
    propagation: result.propagation,
    totalSeedKg: result.totalSeedKg == null ? null : result.totalSeedKg,
    seedRateKgHa: result.seedRateKgHa == null ? null : result.seedRateKgHa,
    totalPlants: result.totalPlants == null ? null : result.totalPlants,
    materialWeight: result.materialWeight || null,
    numBags: result.numBags == null ? null : result.numBags,
    costCertified: result.costCertified == null ? null : result.costCertified,
    currency: result.currency || countryData.currency,
  };
}

const report = { family: 'seed-rate', rows: 55, countryOracles: 54, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
