'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');
const contract = require('../scripts/lib/fr-agriculture-family-contracts/cassava-processing');

function runtime() {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  ['data/agriculture/cassava-processing-data.js', 'engines/cassava-processing-engine.js'].forEach((file) => vm.runInContext(
    fs.readFileSync(path.join(ROOT, file), 'utf8'),
    sandbox,
    { filename: file },
  ));
  return sandbox.window.AfroTools;
}

const rows = manifest.rows.filter((row) => row.family === 'cassava-processing');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const oracles = {};
const afroTools = runtime();

assert.strictEqual(rows.length, 16);
assert.strictEqual(countries.length, 15);
assertNativeFrenchOutput(manifest, rows.map((row) => row.french.route));
assert.strictEqual(
  (fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8').match(/<li><a href="\/fr\/agriculture\/cassava-processing\//g) || []).length,
  15,
);

for (const row of countries) {
  const code = row.country.code;
  const country = afroTools.cassavaProcessing.countries[code];
  const pathwayId = Object.keys(contract.PATHWAYS).find((key) => Number(country[contract.PRICE_KEYS[key]]) > 0);
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const englishHtml = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const input = {
    pathwayId,
    rawTonnes: 1,
    batchesPerMonth: 4,
    rawPricePerTonne: country.fresh_cassava_per_tonne,
    sellingPricePerKg: country[contract.PRICE_KEYS[pathwayId]],
    processingLevel: 'manual',
    includeTransport: false,
    distanceKm: 0,
  };
  const result = afroTools.CassavaProcessingEngine.calculate(input, code);
  const comparisons = afroTools.CassavaProcessingEngine.compareAll(input, code);

  assert.ok(pathwayId, `${code} has no maintained selling price`);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.match(html, /\/engines\/cassava-processing-engine\.js/);
  assert.match(html, /\/data\/agriculture\/cassava-processing-data\.js/);
  assert.ok(englishHtml.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.strictEqual(ai.routes[row.english.routeKey], row.french.routeKey);
  assert.ok(!result.error);
  assert.ok(Number.isFinite(result.outputKg) && result.outputKg > 0);
  assert.ok(Number.isFinite(result.costs.total));
  assert.ok(Number.isFinite(result.revenue));
  assert.ok(comparisons.length > 0);
  assert.strictEqual(result.sym, country.symbol);
  oracles[code] = {
    input,
    outputKg: result.outputKg,
    conversionRate: result.conversionRate,
    sellingPrice: result.sellingPrice,
    revenue: result.revenue,
    totalCost: result.costs.total,
    profitPerBatch: result.profitPerBatch,
    profitMarginPct: result.profitMarginPct,
    monthlyProfit: result.monthlyProfit,
    annualProfit: result.annualProfit,
    roi: result.roi,
    bestComparablePathway: comparisons[0].pathway,
    currency: country.currency,
    symbol: result.sym,
  };
}

const report = { family: 'cassava-processing', rows: 16, countryOracles: 15, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
