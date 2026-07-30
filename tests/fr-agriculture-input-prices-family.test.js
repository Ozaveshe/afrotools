'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/fr-agriculture-parity-manifest.json');
const aiRouteMap = require('../assets/js/ai/french-route-map.generated.js');
const engine = require('../engines/src/input-prices-engine.js');
const contract = require('../scripts/lib/fr-agriculture-family-contracts/input-prices.js');
const { ROOT, assertNativeFrenchOutput } = require('../scripts/lib/fr-agriculture-parity-manifest');

function loadData() {
  const context = {};
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data', 'agriculture', 'input-prices-data.js'), 'utf8'), context);
  return context.INPUT_PRICES;
}

function pageConfig(html) {
  const match = html.match(/<script>window\.__FR_AGRI_PAGE__=([\s\S]*?);<\/script>/);
  assert(match, 'French page config is missing');
  return JSON.parse(match[1]);
}

const data = loadData();
const rows = manifest.rows.filter(row => row.family === 'input-prices');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
const oracles = {};

assert.equal(rows.length, 16);
assert.equal(countries.length, 15);
assertNativeFrenchOutput(manifest, rows.map(row => row.french.route));

const hubHtml = fs.readFileSync(path.join(ROOT, hub.french.file), 'utf8');
assert.equal((hubHtml.match(/<li><a href="\/fr\/agriculture\/input-prices\//g) || []).length, 15);

for (const row of countries) {
  const code = row.country.code;
  const html = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const config = pageConfig(html);
  assert.doesNotMatch(html, /<iframe\b/i);
  assert.match(html, /\/engines\/input-prices-engine\.js/);
  assert.match(html, /\/data\/agriculture\/input-prices-data\.js/);
  assert.match(html, /Exporter en PDF/);
  assert.match(html, /Exporter en CSV/);
  assert.match(html, /Exporter en JSON/);
  assert.match(html, /Exporter en TXT/);
  assert.match(english, /\/engines\/input-prices-engine\.js/);
  assert.match(english, /\/assets\/js\/pages\/input-prices-controller\.js/);
  assert.doesNotMatch(english, /\bfunction\s+runComparison\s*\(/);
  assert.ok(english.includes(`hreflang="fr" href="https://afrotools.com${row.french.route}"`));
  assert.equal(aiRouteMap.routes[row.english.routeKey], row.french.routeKey);
  assert.equal(config.countryCode, code);
  assert.deepEqual(config.behavior, contract.behaviorFor(code));

  const firstCrop = data[code].seeds[0].crop;
  const marketInput = { countryCode: code, inputType: 'all', crop: firstCrop, farmSize: 2.25, priceMode: 'market' };
  const subsidizedInput = { ...marketInput, farmSize: 3.75, priceMode: 'subsidized' };
  const market = engine.calculate(marketInput, data[code], data.appRates, config.behavior);
  const subsidized = engine.calculate(subsidizedInput, data[code], data.appRates, config.behavior);
  const unsupported = engine.calculate(
    { countryCode: code, inputType: 'seeds', crop: '__unsupported__', farmSize: 0.5, priceMode: 'market' },
    data[code],
    data.appRates,
    config.behavior,
  );
  assert.equal(market.countryCode, code);
  assert.equal(market.currency, data[code].currency);
  assert.ok(market.fertilizers.rows.length > 0);
  assert.ok(market.seeds.rows.length > 0);
  assert.ok(market.agrochemicals.groups.length > 0);
  assert.ok(Number.isFinite(market.budget.total) && market.budget.total > 0);
  assert.ok(Number.isFinite(subsidized.budget.total) && subsidized.budget.total > 0);
  assert.equal(unsupported.seeds.usedFallback, true);
  assert.equal(unsupported.seeds.rows.length, data[code].seeds.length);
  oracles[code] = {
    market: {
      input: marketInput,
      cheapestFertilizer: market.fertilizers.cheapest.brand,
      cheapestSeed: market.seeds.cheapest.brand,
      cheapestAgrochemical: market.agrochemicals.cheapest.brand,
      fertilizerSubtotal: market.budget.fertilizerSubtotal,
      seedSubtotal: market.budget.seedSubtotal,
      agrochemicalSubtotal: market.budget.agrochemicalSubtotal,
      total: market.budget.total,
      premium: market.budget.premium,
      savings: market.budget.savings,
    },
    subsidized: {
      input: subsidizedInput,
      total: subsidized.budget.total,
      premium: subsidized.budget.premium,
      savings: subsidized.budget.savings,
    },
    unsupportedCropFallback: {
      usedFallback: unsupported.seeds.usedFallback,
      displayedRows: unsupported.seeds.rows.length,
    },
    behavior: config.behavior,
    currency: data[code].currency,
  };
}

const report = { family: 'input-prices', rows: 16, countryOracles: 15, oracles };
if (process.env.FR_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.FR_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}
console.log(JSON.stringify({ family: report.family, rows: report.rows, countryOracles: report.countryOracles }, null, 2));
