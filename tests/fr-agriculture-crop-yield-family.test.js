'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const contract = require('../scripts/lib/fr-agriculture-family-contracts/crop-yield');
const {
  ROOT,
  assertNativeFrenchOutput,
} = require('../scripts/lib/fr-agriculture-parity-manifest');

function loadRuntime(countryCode) {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  [
    'data/agriculture/crop-database.js',
    `data/agriculture/${countryCode.toLowerCase()}-agri-data.js`,
    'engines/crop-yield-engine.js',
  ].forEach((relativePath) => {
    vm.runInContext(fs.readFileSync(path.join(ROOT, relativePath), 'utf8'), sandbox, { filename: relativePath });
  });
  return sandbox.window.AfroTools;
}

const rows = manifest.rows.filter((row) => row.family === 'crop-yield');
const countryRows = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
assert.strictEqual(rows.length, 55);
assert.strictEqual(countryRows.length, 54);
assert.ok(hub);
assertNativeFrenchOutput(manifest, rows.map((row) => row.french.route));

const hubHtml = fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8');
assert.match(hubHtml, /<html\b[^>]*\blang="fr"/);
assert.doesNotMatch(hubHtml, /<iframe\b/i);
assert.doesNotMatch(hubHtml, /\bfetch\s*\(/i);
assert.strictEqual((hubHtml.match(/<li><a href="\/fr\/agriculture\/crop-yield\//g) || []).length, 54);

const oracles = {};
countryRows.forEach((row) => {
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const code = row.country.code;
  assert.match(html, /<html\b[^>]*\blang="fr"/);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i);
  assert.match(html, new RegExp(`/data/agriculture/${code.toLowerCase()}-agri-data\\.js`));
  assert.match(html, /\/engines\/crop-yield-engine\.js/);
  assert.match(html, /Il ne s’agit pas de données en direct/);
  assert.match(html, /Aucune saisie n’est envoyée à un serveur/);
  assert.ok(english.includes(`hreflang="en" href="https://afrotools.com${row.english.route}"`));
  assert.ok(english.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.strictEqual(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);

  const runtime = loadRuntime(code);
  const data = runtime.countryData;
  assert.strictEqual(data.countryCode, code);
  assert.ok(data.currency);
  assert.ok(data.crops.length);
  assert.ok(data.regions.length);
  assert.ok(data.seasons.length);
  data.crops.forEach((crop) => assert.ok(contract.CROP_NAMES[crop.id], `${code} missing French crop label for ${crop.id}`));
  const presentation = contract.pagePresentation(row);
  data.regions.forEach((region) => {
    assert.ok(presentation.regions[region.id]);
  });
  data.seasons.forEach((season) => assert.ok(presentation.seasons[season.id]));

  const region = data.regions[0];
  const season = data.seasons.find((item) => !item.applicableRegions || item.applicableRegions.includes(region.id));
  const input = contract.buildEngineInput({
    cropId: data.crops[0].id,
    regionId: region.id,
    farmSizeHa: data.agriStats.avgFarmSizeHa || 0.5,
    soilType: region.soilTypes[0],
    irrigationType: 'rainfed',
    fertilizerUsage: 'moderate_inorganic',
    seedType: 'local_variety',
    season: season.id,
  }, code);
  const result = runtime.CropYieldEngine.calculate(input, data, runtime.cropDatabase);
  assert.ok(!result.error, `${code} engine fixture failed`);
  oracles[code] = {
    input,
    estimatedYieldPerHa: result.estimatedYieldPerHa,
    totalEstimatedYield: result.totalEstimatedYield,
    yieldGapPercent: result.yieldGapPercent,
    currency: result.revenueEstimate.currency,
    revenueMid: result.revenueEstimate.mid,
  };
});

assert.strictEqual(Object.keys(oracles).length, 54);
const report = { family: 'crop-yield', rows: 55, countryOracles: 54, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
