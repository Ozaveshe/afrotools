'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/cassava-processing');
const generator = require('../scripts/build-sw-agriculture-family');

function runtime() {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  for (const file of [
    'data/agriculture/cassava-processing-data.js',
    'engines/cassava-processing-engine.js',
  ]) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return sandbox.window.AfroTools;
}

function reference(input, country, pathway) {
  const rawKg = input.rawTonnes * 1000;
  const outputKg = rawKg / pathway.conversionRate;
  const revenue = outputKg * input.sellingPricePerKg;
  const rawMaterial = input.rawTonnes * input.rawPricePerTonne;
  const labor = pathway.laborHrsPerTonneRoots * input.rawTonnes * (country.labor_per_day / 8);
  const fuel = pathway.firewoodKgPerTonneGarri > 0
    ? pathway.firewoodKgPerTonneGarri * outputKg / 1000 * country.firewood_per_kg
    : 0;
  const water = pathway.waterLitresPerTonneRoots * input.rawTonnes / 1000 * country.water_per_1000L;
  const packaging = Math.ceil(outputKg / 50) * country.packaging_50kg_bag;
  const equipmentPurchase = pathway.equipment[input.processingLevel].cost_usd * (country.labor_per_day / 15);
  const equipment = equipmentPurchase / (pathway.lifespan_months || 36) / input.batchesPerMonth;
  const transport = input.includeTransport
    ? outputKg / 1000 * input.distanceKm * country.transport_per_km_tonne
    : 0;
  const total = rawMaterial + labor + fuel + water + packaging + equipment + transport;
  const profit = revenue - total;
  return {
    outputKg: Math.round(outputKg),
    revenue: Math.round(revenue),
    totalCost: Math.round(total),
    profitPerBatch: Math.round(profit),
    monthlyProfit: Math.round(profit * input.batchesPerMonth),
    annualProfit: Math.round(profit * input.batchesPerMonth * 12),
  };
}

const rows = manifest.rows.filter((row) => row.family === 'cassava-processing');
const countries = rows.filter((row) => row.country);
const hub = rows.find((row) => !row.country);
const afroTools = runtime();
const oracleRows = [];

assert.strictEqual(rows.length, 16);
assert.strictEqual(countries.length, 15);
assert.strictEqual(generator.CONTRACTS['cassava-processing'], contract);
assert.deepStrictEqual(generator.FAMILY_SIZES['cassava-processing'], { rows: 16, countries: 15 });
assert.ok(fs.existsSync(path.join(ROOT, 'engines/src/cassava-processing-engine.js')));
assert.ok(fs.existsSync(path.join(ROOT, 'data/agriculture/cassava-processing-data.js')));

const hubHtml = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
assert.strictEqual((hubHtml.match(/<li><a href="\/sw\/kilimo\/usindikaji-mihogo\//g) || []).length, 15);
assert.match(hubHtml, /FAO, ripoti za IITA kuhusu mihogo baada ya mavuno/);
assert.match(hubHtml, /marejeo ya bei ya 2024–2025; si data ya moja kwa moja/);
assert.match(hubHtml, /Kiwango cha uhakika/);
assert.match(hubHtml, /cassava-processing-calculator/);
assert.doesNotMatch(hubHtml, /&amp;amp;|Tomato planning parameters|\b(?:Calculate|Download|Freshness|Confidence|Privacy|Results?)\b/);
oracleRows.push({
  englishId: hub.english.id,
  englishRoute: hub.english.routeKey,
  swahiliRoute: hub.swahili.routeKey,
  countryCode: null,
  validOracle: false,
  invalidOracle: false,
  status: 'hub-route-proof',
});

for (const [index, row] of countries.entries()) {
  const code = row.country.code;
  const country = afroTools.cassavaProcessing.countries[code];
  const pathwayIds = Object.keys(contract.PATHWAYS).filter(
    (id) => Number(country[contract.PRICE_KEYS[id]]) > 0,
  );
  const pathwayId = pathwayIds[index % pathwayIds.length];
  const input = {
    pathwayId,
    rawTonnes: 1 + (index % 3) * 0.25,
    batchesPerMonth: 4 + (index % 4),
    rawPricePerTonne: country.fresh_cassava_per_tonne,
    sellingPricePerKg: country[contract.PRICE_KEYS[pathwayId]],
    laborPerDay: country.labor_per_day,
    processingLevel: ['manual', 'semi_mechanized', 'mechanized'][index % 3],
    includeTransport: index % 2 === 0,
    distanceKm: index % 2 === 0 ? 10 + index : 0,
  };
  const result = afroTools.CassavaProcessingEngine.calculate(input, code);
  const expected = reference(input, country, afroTools.cassavaProcessing.pathways[pathwayId]);
  const comparisons = afroTools.CassavaProcessingEngine.compareAll(input, code);
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');

  assert.ok(country, `${code} country data missing`);
  assert.ok(!result.error, `${code} engine error`);
  assert.deepStrictEqual({
    outputKg: result.outputKg,
    revenue: result.revenue,
    totalCost: result.costs.total,
    profitPerBatch: result.profitPerBatch,
    monthlyProfit: result.monthlyProfit,
    annualProfit: result.annualProfit,
  }, expected, `${code} route formula drift`);
  assert.strictEqual(result.sym, country.symbol);
  assert.ok(comparisons.length > 0);
  assert.match(html, /^<!DOCTYPE html>\s*<html\b[^>]*\blang="sw"/);
  assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
  assert.doesNotMatch(html, /\b(?:Calculate|Reset|Download|Share|Save|Privacy|Freshness|Confidence|Results?)\b/);
  assert.doesNotMatch(html, /&amp;amp;|Tomato planning parameters/);
  assert.match(html, new RegExp(`<meta name="afrotools-country-id" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-source-jurisdiction" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-formula-jurisdiction" content="${code}">`));
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${row.swahili.route}">`));
  assert.ok(html.includes(`<link rel="alternate" hreflang="en" href="https://afrotools.com${row.english.route}">`));
  assert.ok(html.includes(`<link rel="alternate" hreflang="fr" href="https://afrotools.com${row.french.route}">`));
  assert.ok(html.includes(`<link rel="alternate" hreflang="sw" href="https://afrotools.com${row.swahili.route}">`));
  assert.ok(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
  assert.ok(french.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
  assert.ok(html.includes(`src="/${row.artwork.file}"`));
  assert.ok(fs.existsSync(path.join(ROOT, row.artwork.file)));
  assert.ok(html.includes('/engines/cassava-processing-engine.js'));
  assert.ok(html.includes('/assets/js/pages/sw-agriculture-cassava-processing.js'));
  assert.ok(html.includes('FAO, ripoti za IITA'));
  assert.ok(html.includes('marejeo ya bei ya 2024–2025'));
  assert.ok(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`));
  oracleRows.push({
    englishId: row.english.id,
    englishRoute: row.english.routeKey,
    swahiliRoute: row.swahili.routeKey,
    countryCode: code,
    engineOwner: 'engines/src/cassava-processing-engine.js#calculate',
    dataOwners: ['data/agriculture/cassava-processing-data.js'],
    currency: country.currency,
    currencySymbol: country.symbol,
    source: 'FAO, ripoti za IITA kuhusu mihogo baada ya mavuno, na tafiti za masoko ya kikanda',
    freshness: 'marejeo ya bei ya 2024–2025',
    validOracle: { input, expected, actual: expected, comparisons: comparisons.length },
    invalidOracle: {
      boundaries: ['rawTonnes', 'batchesPerMonth', 'rawPricePerTonne', 'sellingPricePerKg', 'laborPerDay', 'distanceKm'],
      controllerOwner: 'assets/js/pages/sw-agriculture-cassava-processing.js',
      staleResultCleared: true,
      exportsDisabled: true,
    },
  });
}

const controller = fs.readFileSync(
  path.join(ROOT, 'assets/js/pages/sw-agriculture-cassava-processing.js'),
  'utf8',
);
assert.doesNotMatch(controller, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
assert.match(controller, /form\.addEventListener\('input',[\s\S]*clearResult/);
assert.match(controller, /form\.addEventListener\('change',[\s\S]*clearResult/);
assert.match(controller, /setActionsEnabled\(false\)/);
assert.match(controller, /navigator\.share/);

const report = {
  schemaVersion: 1,
  family: 'cassava-processing',
  routes: 16,
  countryOracles: 15,
  rows: oracleRows,
};
if (process.env.SW_AGRI_ORACLE_OUTPUT) {
  fs.writeFileSync(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`);
}
console.log(JSON.stringify({ family: report.family, routes: report.routes, countryOracles: report.countryOracles }, null, 2));
