'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const engine = require('../engines/src/input-prices-engine.js');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/input-prices.js');
const { alternateEntries } = require('../scripts/lib/fr-agriculture-hreflang');

const ROOT = path.resolve(__dirname, '..');
function loadData() { const context = {}; vm.createContext(context); vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture/input-prices-data.js'), 'utf8'), context); return context.INPUT_PRICES; }
function pageConfig(html) { const match = html.match(/<script>window\.__SW_AGRI_PAGE__=([\s\S]*?);<\/script>/); assert(match, 'Swahili page config is missing.'); return JSON.parse(match[1]); }
function selectedFertilizerPrice(row, mode) { return mode === 'subsidized' && row.subsidizedPrice ? row.subsidizedPrice : row.marketPrice; }
function seedUnitPrice(row, strategy) { return strategy === 'legacy-post-division-fallback' ? row.price / row.bag_kg || row.price : row.price / (row.bag_kg || 25); }
function reference(input, country, appRates, behavior) {
  const farmSize = Number(input.farmSize), includeFertilizers = input.inputType === 'all' || input.inputType === 'fertilizers';
  const includeSeeds = input.inputType === 'all' || input.inputType === 'seeds', includeChemicals = input.inputType === 'all' || input.inputType === 'agrochemicals';
  const perKgDecimals = behavior.fertilizerPerKgDecimals === 0 ? 0 : 1;
  let fertilizer = null, fertilizerSubtotal = 0;
  if (includeFertilizers) {
    fertilizer = country.fertilizers.slice().sort((a, b) => selectedFertilizerPrice(a, input.priceMode) - selectedFertilizerPrice(b, input.priceMode))[0];
    const price = selectedFertilizerPrice(fertilizer, input.priceMode), bagsPerHa = appRates.fertilizer[fertilizer.brand.split(' ')[0]] || 3;
    fertilizerSubtotal = price * bagsPerHa * farmSize;
    fertilizer = { brand: fertilizer.brand, selectedPrice: price, perKg: Number((price / fertilizer.bag_kg).toFixed(perKgDecimals)), bagsPerHa };
  }
  let seeds = country.seeds.filter(row => !input.crop || row.crop === input.crop), usedFallback = includeSeeds && seeds.length === 0;
  if (usedFallback) seeds = country.seeds.slice();
  let seed = null, seedSubtotal = 0;
  if (includeSeeds) {
    seed = seeds.slice().sort((a, b) => seedUnitPrice(a, behavior.seedSortStrategy) - seedUnitPrice(b, behavior.seedSortStrategy))[0];
    const rate = appRates.seeds[seed.crop] || 30, quantity = Math.ceil(rate * farmSize / (seed.bag_kg || 25));
    seedSubtotal = seed.price * quantity; seed = { brand: seed.brand, quantity, total: seedSubtotal };
  }
  let chemical = null, agrochemicalSubtotal = 0;
  if (includeChemicals) {
    chemical = country.agrochemicals.slice().sort((a, b) => a.price - b.price)[0]; agrochemicalSubtotal = chemical.price * farmSize;
    chemical = { brand: chemical.brand, total: agrochemicalSubtotal };
  }
  const total = fertilizerSubtotal + seedSubtotal + agrochemicalSubtotal;
  const premium = total * 1.35;
  return { visibility: { fertilizers: includeFertilizers, seeds: includeSeeds, agrochemicals: includeChemicals }, fertilizer, seed, chemical, usedFallback,
    budget: { fertilizerSubtotal, seedSubtotal, agrochemicalSubtotal, total, premium, savings: premium - total } };
}
function runtimeSummary(result) {
  return { visibility: result.visibility, fertilizer: result.fertilizers.cheapest && { brand: result.fertilizers.cheapest.brand, selectedPrice: result.fertilizers.cheapest.selectedPrice, perKg: result.fertilizers.cheapest.perKg, bagsPerHa: result.fertilizers.cheapest.bagsPerHa },
    seed: result.seeds.cheapest && { brand: result.seeds.cheapest.brand, quantity: result.seeds.cheapest.quantity, total: result.seeds.cheapest.total },
    chemical: result.agrochemicals.cheapest && { brand: result.agrochemicals.cheapest.brand, total: result.agrochemicals.cheapest.total }, usedFallback: result.seeds.usedFallback,
    budget: { fertilizerSubtotal: result.budget.fertilizerSubtotal, seedSubtotal: result.budget.seedSubtotal, agrochemicalSubtotal: result.budget.agrochemicalSubtotal, total: result.budget.total, premium: result.budget.premium, savings: result.budget.savings } };
}

const data = loadData();
const rows = manifest.rows.filter(row => row.family === 'input-prices');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
assert.equal(rows.length, 16); assert.equal(countries.length, 15); assert(hub);
const reportRows = [];

for (const row of rows) {
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i); assert.match(html, /Kiwango cha uhakika/); assert.match(html, new RegExp(`<code>${row.english.id}</code>`));
  assert.equal(fs.existsSync(path.join(ROOT, row.artwork.file)), true, `Missing artwork for ${row.english.id}.`);
  for (const alternate of alternateEntries(row)) assert(html.includes(`hreflang="${alternate.hreflang}" href="https://afrotools.com${alternate.route}"`));
  const visible = html.replace(/<script[\s\S]*?<\/script>/gi, '').replace(/<style[\s\S]*?<\/style>/gi, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
  assert.doesNotMatch(visible, /\b(?:Product|Supplier|Bag size|Price\/bag|Per kg|Seeds|Fertilizer|Chemicals|Total \(cheapest\)|Data sources|Freshness|Confidence|Privacy|Export|Reset)\b/i);
  if (!row.country) {
    assert.equal((html.match(/<li><a href="\/sw\/kilimo\/bei-za-pembejeo\//g) || []).length, 15);
    assert.match(html, /Rasilimali za mbolea za FAO<\/a>/); assert.match(html, /robo ya kwanza ya 2026/);
    reportRows.push({ englishId: row.english.id, route: row.swahili.routeKey, kind: 'hub', source: true, artwork: row.artwork.file }); continue;
  }
  assert.match(html, /\/engines\/input-prices-engine\.js/); assert.match(html, /\/data\/agriculture\/input-prices-data\.js/);
  const config = pageConfig(html), code = row.country.code, country = data[code];
  assert.equal(config.countryCode, code); assert.equal(config.countryName, contract.countryName(row)); assert.deepEqual(config.behavior, contract.behaviorFor(code));
  const source = contract.sourceMetadata(row); assert.equal(config.sourceLabel, source.source); assert(html.includes(source.source.replace(/&/g, '&amp;').replace(/'/g, '&#39;')) || html.includes(source.source));
  const crop = country.seeds[(reportRows.length * 3) % country.seeds.length].crop;
  const input = { countryCode: code, inputType: 'all', crop, farmSize: Number((1.25 + reportRows.length * 0.37).toFixed(2)), priceMode: reportRows.length % 2 ? 'subsidized' : 'market' };
  const expected = reference(input, country, data.appRates, config.behavior), actual = engine.calculate(input, country, data.appRates, config.behavior);
  assert.deepEqual(runtimeSummary(actual), expected, `${row.english.id} exact engine oracle drifted.`);
  const categories = {};
  for (const inputType of ['fertilizers', 'seeds', 'agrochemicals']) {
    const categoryInput = { ...input, inputType }, categoryExpected = reference(categoryInput, country, data.appRates, config.behavior);
    const categoryActual = engine.calculate(categoryInput, country, data.appRates, config.behavior);
    assert.deepEqual(runtimeSummary(categoryActual), categoryExpected, `${row.english.id}/${inputType} oracle drifted.`);
    categories[inputType] = { input: categoryInput, expected: categoryExpected };
  }
  const unsupportedInput = { ...input, inputType: 'seeds', crop: '__unsupported__', farmSize: 0.5 };
  const unsupported = engine.calculate(unsupportedInput, country, data.appRates, config.behavior);
  assert.equal(unsupported.seeds.usedFallback, true); assert.equal(unsupported.seeds.rows.length, country.seeds.length);
  reportRows.push({ englishId: row.english.id, route: row.swahili.routeKey, kind: 'country', countryCode: code, countryName: config.countryName, currency: country.currency,
    source: source.source, validOracle: { input, expected }, categoryOracles: categories,
    unsupportedCropFallback: { input: unsupportedInput, displayedRows: unsupported.seeds.rows.length },
    invalidOracle: { boundaries: ['farm-size-zero', 'farm-size-negative', 'farm-size-empty', 'farm-size-over-100000', 'invalid-input-type', 'invalid-price-mode', 'invalid-crop'] }, artwork: row.artwork.file });
}

const report = { schemaVersion: 1, family: 'input-prices', baseSha: '0f6990118d9ac8b9dcde446a6ede10a017b9a2db', routes: 16, countryOracles: 15, rows: reportRows };
if (process.env.SW_AGRI_ORACLE_OUTPUT) fs.writeFileSync(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({ family: report.family, routes: report.routes, countryOracles: report.countryOracles }, null, 2));
