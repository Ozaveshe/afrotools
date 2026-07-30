'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const cropContract = require('../scripts/lib/fr-agriculture-family-contracts/crop-yield');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

function loadRuntime(code) {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  ['data/agriculture/crop-database.js', `data/agriculture/${code.toLowerCase()}-agri-data.js`, 'engines/fertilizer-engine.js'].forEach((file) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  });
  return sandbox.window.AfroTools;
}

const rows = manifest.rows.filter((row) => row.family === 'fertilizer');
const countryRows = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
assert.strictEqual(rows.length, 55);
assert.strictEqual(countryRows.length, 54);
assertNativeFrenchOutput(manifest, rows.map((row) => row.french.route));
const hubHtml = fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8');
assert.strictEqual((hubHtml.match(/<li><a href="\/fr\/agriculture\/fertilizer\//g) || []).length, 54);

const oracles = {};
countryRows.forEach((row) => {
  const code = row.country.code;
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  assert.match(html, /<html\b[^>]*\blang="fr"/);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i);
  assert.match(html, new RegExp(`/data/agriculture/${code.toLowerCase()}-agri-data\\.js`));
  assert.match(html, /\/engines\/fertilizer-engine\.js/);
  assert.match(html, /Aucune donnée en direct/);
  assert.match(html, /Aucune saisie n’est envoyée à un serveur/);
  ['Copier', 'Partager', 'Enregistrer dans ce navigateur', 'Exporter en PDF', 'Exporter en CSV', 'Exporter en JSON', 'Exporter en TXT', 'Réinitialiser'].forEach((label) => assert.ok(html.includes(label)));
  assert.ok(english.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.strictEqual(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);

  const runtime = loadRuntime(code);
  const data = runtime.countryData;
  const supported = data.crops.filter((crop) => crop.nutrientUptake || (runtime.cropDatabase.crops[crop.id] && runtime.cropDatabase.crops[crop.id].nutrientUptake));
  assert.ok(supported.length, `${code} has no maintained nutrient method`);
  supported.forEach((crop) => assert.ok(cropContract.CROP_NAMES[crop.id], `${code} missing French crop label ${crop.id}`));
  const region = data.regions[0];
  const input = {
    cropId: supported[0].id,
    regionId: region.id,
    farmSizeHa: data.agriStats.avgFarmSizeHa || 1,
    targetYieldPerHa: null,
    soilType: region.soilTypes[0],
    previousCrop: 'none',
    soilTest: { organicMatter: 0, P_ppm: 0, K_ppm: 0 },
  };
  const result = runtime.FertilizerEngine.calculate(input, data, runtime.cropDatabase);
  assert.ok(!result.error, `${code} fertilizer engine fixture failed`);
  assert.strictEqual(result.currency, data.currency);
  oracles[code] = {
    input,
    perHa: result.perHa,
    totalNPK: result.totalNPK,
    products: result.products.map((item) => ({ name: item.name, bags: item.bags, totalWeight_kg: item.totalWeight_kg })),
    costMarket: result.costMarket,
    costSubsidy: result.costSubsidy,
    currency: result.currency,
  };
});

const report = { family: 'fertilizer', rows: 55, countryOracles: 54, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
