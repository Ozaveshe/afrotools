'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const contract = require('../scripts/lib/fr-agriculture-family-contracts/crop-yield');
const { normalizeBuildManagedHtml } = require('../scripts/lib/shared-asset-references');
const {
  ROOT,
  normalizeRoute,
  assertNativeFrenchOutput,
} = require('../scripts/lib/fr-agriculture-parity-manifest');

const PILOT_CODES = ['SN', 'CI', 'CM', 'MA', 'CD'];
const ORACLES = {
  SN: { estimatedYieldPerHa: 0.63, totalEstimatedYield: 1.58, yieldGapPercent: 75, currency: 'XOF', revenueMid: 554243 },
  CI: { estimatedYieldPerHa: 0.59, totalEstimatedYield: 1.78, yieldGapPercent: 60, currency: 'XOF', revenueMid: 2673340 },
  CM: { estimatedYieldPerHa: 0.61, totalEstimatedYield: 0.91, yieldGapPercent: 59, currency: 'XAF', revenueMid: 1372410 },
  MA: { estimatedYieldPerHa: 2.2, totalEstimatedYield: 11, yieldGapPercent: 56, currency: 'MAD', revenueMid: 38489 },
  CD: { estimatedYieldPerHa: 8.6, totalEstimatedYield: 4.3, yieldGapPercent: 66, currency: 'CDF', revenueMid: 1075250 },
};

function loadAcceptedRuntime(countryCode) {
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

const rows = manifest.rows.filter((row) => (
  row.family === 'crop-yield'
  && row.country
  && PILOT_CODES.includes(row.country.code)
));
assert.strictEqual(rows.length, 5);
assertNativeFrenchOutput(manifest, rows.map((row) => row.french.route));

rows.forEach((row) => {
  const code = row.country.code;
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const sourceHtml = normalizeBuildManagedHtml(html);
  assert.match(html, /<html\b[^>]*\blang="fr"/);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.doesNotMatch(html, /\bfetch\s*\(\s*["'`]\/?(?:agriculture|tools)\//i);
  assert.match(html, new RegExp(`<meta name="afrotools-country-id" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-source-jurisdiction" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-formula-jurisdiction" content="${code}">`));
  assert.match(sourceHtml, new RegExp(`<script\\b[^>]*src="/data/agriculture/${code.toLowerCase()}-agri-data\\.js(?:\\?[^"]*)?"[^>]*></script>`));
  assert.match(sourceHtml, /<script\b[^>]*src="\/engines\/crop-yield-engine\.js(?:\?[^"]*)?"[^>]*><\/script>/);
  assert.match(sourceHtml, /<script\b[^>]*src="\/assets\/vendor\/jspdf\/jspdf\.umd\.min\.js(?:\?[^"]*)?"[^>]*><\/script>/);
  assert.match(html, /<link rel="canonical" href="https:\/\/afrotools\.com\/fr\/agriculture\/crop-yield\//);
  assert.match(html, /hreflang="fr"/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /"inLanguage":"fr"/);
  assert.match(html, /Il ne s’agit pas de données en direct/);
  assert.match(html, /Aucune saisie n’est envoyée à un serveur/);
  ['Copier', 'Partager', 'Enregistrer dans ce navigateur', 'Exporter en PDF', 'Exporter en CSV', 'Exporter en JSON', 'Exporter en TXT', 'Réinitialiser'].forEach((label) => {
    assert.ok(html.includes(label), `${row.french.file} missing ${label}`);
  });
  assert.ok(row.artwork.file, `${row.english.id} pilot artwork must exist`);
  assert.strictEqual(aiRouteMap.routes[row.english.routeKey], row.french.routeKey, `${row.english.id} French AI mapping`);

  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  assert.ok(
    english.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`)
      || english.includes(`hreflang="fr" href="https://afrotools.com${row.french.routeKey.replace(/\/$/, '')}"`),
    `${row.english.file} must reciprocate the French route`
  );

  const runtime = loadAcceptedRuntime(code);
  const data = runtime.countryData;
  const region = data.regions[0];
  const season = data.seasons.find((item) => !item.applicableRegions || item.applicableRegions.includes(region.id));
  const values = {
    cropId: data.crops[0].id,
    regionId: region.id,
    farmSizeHa: data.agriStats.avgFarmSizeHa || 0.5,
    soilType: region.soilTypes[0],
    irrigationType: 'rainfed',
    fertilizerUsage: 'moderate_inorganic',
    seedType: 'local_variety',
    season: season.id,
  };
  const input = contract.buildEngineInput(values, code);
  assert.deepStrictEqual(JSON.parse(JSON.stringify(input)), { countryCode: code, ...values });
  const result = runtime.CropYieldEngine.calculate(input, data, runtime.cropDatabase);
  const oracle = ORACLES[code];
  assert.strictEqual(result.estimatedYieldPerHa, oracle.estimatedYieldPerHa);
  assert.strictEqual(result.totalEstimatedYield, oracle.totalEstimatedYield);
  assert.strictEqual(result.yieldGapPercent, oracle.yieldGapPercent);
  assert.strictEqual(result.revenueEstimate.currency, oracle.currency);
  assert.strictEqual(result.revenueEstimate.mid, oracle.revenueMid);
});

const retired = fs.readFileSync(path.join(ROOT, 'scripts/gen-fr-agriculture.sh'), 'utf8').split(/\r?\n/).slice(0, 8).join('\n');
assert.match(retired, /RETIRED/);
assert.match(retired, /exit 1/);
assert.doesNotMatch(retired, /C:\/Users\/Oza\/Documents\/afrotools/);

const { assertCropYieldPilotAccepted } = require('../scripts/build-fr-agriculture-family');
const pendingPilot = JSON.parse(JSON.stringify(manifest));
pendingPilot.rows
  .filter((row) => row.family === 'crop-yield' && row.country && PILOT_CODES.includes(row.country.code))
  .forEach((row) => { row.acceptance.state = 'pending'; });
assert.throws(() => assertCropYieldPilotAccepted(pendingPilot, contract), /locked until all five/);
assert.strictEqual(assertCropYieldPilotAccepted(manifest, contract), true);
assert.strictEqual(normalizeRoute('/fr/agriculture/crop-yield/senegal'), '/fr/agriculture/crop-yield/senegal/');

console.log('French Crop Yield five-country engine, owner, SEO, AI, artwork, privacy and export contracts passed.');
