'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/fish-farming');
const generator = require('../scripts/build-sw-agriculture-family');

function runtime() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of ['data/agriculture/aquaculture-data.js', 'engines/aquaculture-roi-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return sandbox.window;
}
function round(value) { return Math.round(100 * value) / 100; }
function reference(input, data) {
  const costs = data.COSTS[input.countryCode];
  const species = data.SPECIES[input.speciesId];
  if (!costs || !species) return { error: `Data not found for ${input.countryCode}/${input.speciesId}` };
  const effectiveArea = input.system === 'tarpaulin_tank' ? input.pondArea / 200 : input.pondArea;
  const density = species.stockingDensity[input.system] || species.stockingDensity.earthen_pond;
  const densityValue = input.densityLevel === 'low' ? density.low : input.densityLevel === 'high' ? density.high : density.medium;
  const fishStocked = Math.round(effectiveArea * densityValue);
  const survival = input.managementLevel === 'good' ? species.survivalRate_pct.good / 100
    : input.managementLevel === 'poor' ? species.survivalRate_pct.poor / 100 : species.survivalRate_pct.average / 100;
  const fishHarvested = Math.round(fishStocked * survival);
  const marketSize = input.targetSizeLevel === 'min' ? species.marketSize_kg.min
    : input.targetSizeLevel === 'premium' ? species.marketSize_kg.premium : species.marketSize_kg.typical;
  const harvestKg = round(fishHarvested * marketSize);
  const cycles = input.cyclesPerYear || 1;
  const fcr = input.managementLevel === 'good' ? species.feedConversionRatio.good
    : input.managementLevel === 'poor' ? species.feedConversionRatio.poor : species.feedConversionRatio.average;
  const feedKg = round(harvestKg * fcr);
  const feedPrice = costs.feed_per_kg[input.feedType] || costs.feed_per_kg.local_float;
  const feedCost = round(feedKg * feedPrice);
  const fingerlingPrice = costs.fingerling[input.speciesId] || costs.fingerling[Object.keys(costs.fingerling)[0]] || 0;
  const fingerlingCost = round(fishStocked * fingerlingPrice);
  const laborCost = round((input.laborDays || costs.labor_days_cycle) * costs.labor_per_day * (1 - (input.familyLaborPct || 0) / 100 * 0.5));
  const electricityCost = round((costs.electricity_monthly || 0) * input.growPeriodMonths);
  const waterCost = round((costs.water_monthly || 0) * input.growPeriodMonths);
  const medicationsCost = costs.medications_cycle || 0;
  const transportCost = round(harvestKg * (costs.transport_per_kg || 0));
  const opCostTotal = feedCost + fingerlingCost + laborCost + electricityCost + waterCost + medicationsCost + transportCost;
  let infraTotal = 0;
  if (!input.hasExistingInfra) {
    if (input.system === 'earthen_pond' || input.system === 'concrete_tank') {
      infraTotal = input.pondArea * (costs.infrastructure[input.system === 'earthen_pond' ? 'earthen_pond_m2' : 'concrete_tank_m2'] || 0);
    } else if (input.system === 'tarpaulin_tank') {
      const small = costs.infrastructure.tarpaulin_1000L || 0;
      const large = costs.infrastructure.tarpaulin_5000L || 0;
      const remainder = input.pondArea % 5000;
      infraTotal = Math.ceil(input.pondArea / 5000) * large;
      if (remainder > 0 && remainder <= 1000) infraTotal += small;
      else if (remainder > 1000) infraTotal += Math.ceil(remainder / 1000) * small;
    } else if (input.system === 'cage') {
      infraTotal = input.pondArea * (costs.infrastructure.earthen_pond_m2 || 0) * 0.4;
    }
    infraTotal += (costs.infrastructure.pump || 0) + (costs.infrastructure.aerator || 0)
      + (input.needsBorehole ? costs.infrastructure.borehole || 0 : 0) + (costs.infrastructure.nets_scales || 0);
  }
  const infraAmortized = round(infraTotal / 10);
  const totalCostPerCycle = round(opCostTotal + infraAmortized);
  const priceKey = input.processingLevel === 'smoked' ? `${input.speciesId}_smoked`
    : input.processingLevel === 'dried' ? `${input.speciesId}_dried`
      : input.processingLevel === 'fillet' ? `${input.speciesId}_fillet`
        : input.sellingMethod === 'live' ? `${input.speciesId}_live` : `${input.speciesId}_fresh`;
  const sellingPrice = costs.selling_per_kg[priceKey] || costs.selling_per_kg[`${input.speciesId}_fresh`]
    || costs.selling_per_kg[`${input.speciesId}_live`] || Object.values(costs.selling_per_kg)[0];
  const revenue = round(harvestKg * sellingPrice);
  const processingCost = input.processingLevel && input.processingLevel !== 'none'
    ? round(revenue * ((costs.processing_cost_pct || 10) / 100)) : 0;
  const netRevenue = round(revenue - processingCost);
  const profitPerCycle = round(netRevenue - totalCostPerCycle);
  const annualProfit = round(profitPerCycle * cycles);
  return {
    fishStocked, survivalPct: Math.round(100 * survival), fishHarvested, harvestKg,
    cyclesPerYear: cycles, annualKg: round(harvestKg * cycles), feedKg,
    feedBags: Math.ceil(feedKg / 25), growPeriodMonths: input.growPeriodMonths,
    infraTotal, infraAmortized, feedCost, fingerlingCost, laborCost, electricityCost,
    waterCost, medicationsCost, transportCost, processingCost, opCostTotal,
    totalCostPerCycle, revenue, netRevenue, profitPerCycle, annualProfit,
    roiPct: infraTotal > 0 ? round(annualProfit / infraTotal * 100) : null,
    paybackMonths: annualProfit > 0 ? round(infraTotal / annualProfit * 12) : null,
    costPerKg: harvestKg > 0 ? round(totalCostPerCycle / harvestKg) : 0,
    breakEvenPrice: harvestKg > 0 ? round(totalCostPerCycle / harvestKg) : 0,
    profitMargin: netRevenue > 0 ? round(profitPerCycle / netRevenue * 100) : 0,
    sellingPrice, feedPricePerKg: feedPrice, fingerlingPrice,
    sym: costs.symbol, isProfit: profitPerCycle >= 0
  };
}
function comparable(result) {
  const keys = [
    'fishStocked', 'survivalPct', 'fishHarvested', 'harvestKg', 'cyclesPerYear', 'annualKg',
    'feedKg', 'feedBags', 'growPeriodMonths', 'infraTotal', 'infraAmortized', 'feedCost',
    'fingerlingCost', 'laborCost', 'electricityCost', 'waterCost', 'medicationsCost',
    'transportCost', 'processingCost', 'opCostTotal', 'totalCostPerCycle', 'revenue',
    'netRevenue', 'profitPerCycle', 'annualProfit', 'roiPct', 'paybackMonths', 'costPerKg',
    'breakEvenPrice', 'profitMargin', 'sellingPrice', 'feedPricePerKg', 'fingerlingPrice', 'sym', 'isProfit'
  ];
  return Object.fromEntries(keys.map(key => [key, result[key]]));
}

const rows = manifest.rows.filter(row => row.family === 'fish-farming');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
const browserRuntime = runtime();
const data = browserRuntime.AquaData;
const engine = browserRuntime.AquaROI;
const oracleRows = [];

assert.strictEqual(rows.length, 16);
assert.strictEqual(countries.length, 15);
assert.strictEqual(generator.CONTRACTS['fish-farming'], contract);
assert.deepStrictEqual(generator.FAMILY_SIZES['fish-farming'], { rows: 16, countries: 15 });
assert.deepStrictEqual(
  generator.parseArgs(['--family', 'fish-farming', '--full-mesh', '--check']),
  { family: 'fish-farming', check: true, fullMesh: true }
);
assert.deepStrictEqual(contract.alternateEntries(countries[0]).map(entry => entry.hreflang), ['en', 'sw', 'x-default']);
assert.ok(contract.alternateEntries(countries.find(row => row.country.code === 'NG'), true).some(entry => entry.hreflang === 'ha'));
Object.keys(data.SPECIES).forEach(key => assert.ok(contract.SPECIES[key], `missing Swahili species ${key}`));
Object.keys(data.SYSTEMS).forEach(key => assert.ok(contract.SYSTEMS[key], `missing Swahili system ${key}`));

const hubHtml = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
assert.strictEqual((hubHtml.match(/<li><a href="\/sw\/kilimo\/ufugaji-samaki\//g) || []).length, 15);
assert.match(hubHtml, /FAO SOFIA 2024 — Hali ya Uvuvi na Ufugaji wa Samaki Duniani<\/a>/);
assert.match(hubHtml, /WorldFish Center<\/a>/);
assert.match(hubHtml, /gharama za soko za 2024–2025/);
assert.match(hubHtml, /Kiwango cha uhakika/);
assert.doesNotMatch(hubHtml, /&amp;amp;|â|Ã|Data sources:|Costs reflect|\b(?:Calculate|Download|Freshness|Confidence|Privacy|Results?)\b/);
oracleRows.push({ englishId: hub.english.id, englishRoute: hub.english.routeKey, swahiliRoute: hub.swahili.routeKey, countryCode: null, validOracle: false, invalidOracle: false, status: 'hub-route-proof' });

const systems = Object.keys(data.SYSTEMS);
const densities = Object.keys(contract.DENSITIES);
const management = Object.keys(contract.MANAGEMENT);
const targets = Object.keys(contract.TARGETS);
const processing = Object.keys(contract.PROCESSING);
for (const [index, row] of countries.entries()) {
  const code = row.country.code;
  const costs = data.COSTS[code];
  const speciesId = costs.dominantSpecies[index % costs.dominantSpecies.length];
  const species = data.SPECIES[speciesId];
  const availableFeeds = Object.keys(costs.feed_per_kg);
  const input = {
    countryCode: code, speciesId, system: systems[index % systems.length],
    pondArea: systems[index % systems.length] === 'tarpaulin_tank' ? 6200 + index * 100 : 180 + index * 31,
    densityLevel: densities[index % densities.length], managementLevel: management[index % management.length],
    targetSizeLevel: targets[index % targets.length], growPeriodMonths: species.growOutPeriod_months.typical,
    cyclesPerYear: 1 + (index % 3), feedType: availableFeeds[index % availableFeeds.length],
    processingLevel: processing[index % processing.length], sellingMethod: 'fresh',
    hasExistingInfra: index % 2 === 1, needsBorehole: index % 3 === 0,
    familyLaborPct: (index % 5) * 10, laborDays: costs.labor_days_cycle + index
  };
  const actual = engine.calculate(input);
  const expected = reference(input, data);
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const source = contract.sourceMetadata(row);

  assert.ok(!actual.error, `${code} engine error: ${actual.error}`);
  assert.deepStrictEqual(comparable(actual), comparable(expected), `${code} formula drift`);
  assert.match(html, /^<!DOCTYPE html>\s*<html\b[^>]*\blang="sw"/);
  assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
  assert.doesNotMatch(html, /&amp;amp;|â|Ã|Data sources:|Costs reflect|\b(?:Calculate|Reset|Download|Share|Save|Privacy|Freshness|Confidence|Results?)\b/);
  for (const meta of ['afrotools-country-id', 'afrotools-source-jurisdiction', 'afrotools-formula-jurisdiction']) {
    assert.match(html, new RegExp(`<meta name="${meta}" content="${code}">`));
  }
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${row.swahili.route}">`));
  for (const { hreflang, route } of contract.alternateEntries(row)) {
    assert.ok(html.includes(`<link rel="alternate" hreflang="${hreflang}" href="https://afrotools.com${route}">`));
  }
  assert.ok(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
  assert.ok(html.includes(`src="/${row.artwork.file}"`) && fs.existsSync(path.join(ROOT, row.artwork.file)));
  assert.ok(html.includes('/engines/aquaculture-roi-engine.js'));
  assert.ok(html.includes('/data/agriculture/aquaculture-data.js'));
  assert.ok(html.includes('/assets/js/pages/sw-agriculture-fish-farming.js'));
  assert.ok(source.complete.includes('FAO SOFIA') && source.complete.includes('WorldFish Center'));
  assert.ok(html.includes(contract.SOURCE_LABEL.replace(/&/g, '&amp;')));
  assert.ok(html.includes('FAO SOFIA 2024 — Hali ya Uvuvi na Ufugaji wa Samaki Duniani</a>'));
  assert.ok(html.includes('WorldFish Center</a>'));
  assert.ok(html.includes(contract.DATA_REVIEWED));
  assert.ok(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`));
  assert.ok(html.includes(contract.countryName(row)));
  oracleRows.push({
    englishId: row.english.id, englishRoute: row.english.routeKey, swahiliRoute: row.swahili.routeKey,
    countryCode: code, countryName: contract.countryName(row),
    engineOwner: 'engines/src/aquaculture-roi-engine.js#calculate', dataOwners: ['data/agriculture/aquaculture-data.js'],
    currency: costs.currency, source: contract.SOURCE_LABEL, freshness: contract.DATA_REVIEWED,
    validOracle: { input, expected: comparable(expected), actual: comparable(actual) },
    invalidOracle: {
      boundaries: ['area:min', 'area:max', 'area:required', 'months:min', 'months:max', 'months:integer', 'cycles:min', 'cycles:max', 'cycles:integer', 'laborDays:min', 'laborDays:max', 'laborDays:integer', 'familyLabor:min', 'familyLabor:max', 'select:invalid'],
      controllerOwner: 'assets/js/pages/sw-agriculture-fish-farming.js', staleResultCleared: true, exportsDisabled: true
    }
  });
}

const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/sw-agriculture-fish-farming.js'), 'utf8');
assert.doesNotMatch(controller, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
assert.match(controller, /form\.addEventListener\('input',[\s\S]*clearResult/);
assert.match(controller, /form\.addEventListener\('change',[\s\S]*clearResult/);
assert.match(controller, /setActionsEnabled\(false\)/);
assert.match(controller, /navigator\.share/);

const report = { schemaVersion: 1, family: 'fish-farming', routes: 16, countryOracles: 15, rows: oracleRows };
if (process.env.SW_AGRI_ORACLE_OUTPUT) fs.writeFileSync(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ family: report.family, routes: report.routes, countryOracles: report.countryOracles }, null, 2));
