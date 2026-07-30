'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const ai = require('../assets/js/ai/french-route-map.generated.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

function runtime() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  ['data/agriculture/aquaculture-data.js', 'engines/aquaculture-roi-engine.js'].forEach((file) => vm.runInContext(
    fs.readFileSync(path.join(ROOT, file), 'utf8'),
    sandbox,
    { filename: file },
  ));
  return sandbox.window;
}

const rows = manifest.rows.filter((row) => row.family === 'fish-farming');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const oracles = {};
const browserRuntime = runtime();

assert.strictEqual(rows.length, 16);
assert.strictEqual(countries.length, 15);
assertNativeFrenchOutput(manifest, rows.map((row) => row.french.route));
assert.strictEqual(
  (fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8').match(/<li><a href="\/fr\/agriculture\/fish-farming\//g) || []).length,
  15,
);

for (const row of countries) {
  const code = row.country.code;
  const costs = browserRuntime.AquaData.COSTS[code];
  const speciesId = costs.dominantSpecies[0];
  const species = browserRuntime.AquaData.SPECIES[speciesId];
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const englishHtml = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const input = {
    countryCode: code,
    speciesId,
    system: 'earthen_pond',
    pondArea: 500,
    densityLevel: 'medium',
    managementLevel: 'average',
    targetSizeLevel: 'typical',
    growPeriodMonths: species.growOutPeriod_months.typical,
    cyclesPerYear: 1,
    feedType: 'local_float',
    processingLevel: 'none',
    sellingMethod: 'fresh',
    hasExistingInfra: false,
    needsBorehole: false,
    familyLaborPct: 0,
    laborDays: costs.labor_days_cycle,
  };
  const result = browserRuntime.AquaROI.calculate(input);

  assert.doesNotMatch(html, /<iframe\b/i);
  assert.match(html, /\/engines\/aquaculture-roi-engine\.js/);
  assert.match(html, /\/data\/agriculture\/aquaculture-data\.js/);
  assert.ok(englishHtml.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.strictEqual(ai.routes[row.english.routeKey], row.french.routeKey);
  assert.ok(!result.error);
  assert.ok(Number.isFinite(result.fishStocked) && result.fishStocked > 0);
  assert.ok(Number.isFinite(result.harvestKg) && result.harvestKg > 0);
  assert.ok(Number.isFinite(result.totalCostPerCycle));
  assert.ok(Number.isFinite(result.revenue));
  assert.strictEqual(result.sym, costs.symbol);
  oracles[code] = {
    input,
    fishStocked: result.fishStocked,
    fishHarvested: result.fishHarvested,
    harvestKg: result.harvestKg,
    feedKg: result.feedKg,
    totalCostPerCycle: result.totalCostPerCycle,
    revenue: result.revenue,
    profitPerCycle: result.profitPerCycle,
    annualProfit: result.annualProfit,
    roiPct: result.roiPct,
    currency: costs.currency,
    symbol: result.sym,
  };
}

const report = { family: 'fish-farming', rows: 16, countryOracles: 15, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
