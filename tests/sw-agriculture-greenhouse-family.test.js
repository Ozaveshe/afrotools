'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/greenhouse');
const generator = require('../scripts/build-sw-agriculture-family');
const { escapeHtml } = require('../scripts/lib/fr-agriculture-page-shell');

function runtime() {
  const sandbox = { window: {} };
  vm.createContext(sandbox);
  for (const file of ['data/agriculture/greenhouse-data.js', 'engines/greenhouse-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return { data: sandbox.GREENHOUSE_DATA, engine: sandbox.window.GHEngine };
}
function reference(input, data) {
  const country = data.countries[input.countryCode];
  const type = data.types[input.greenhouseType];
  const cropMeta = data.crops[input.crop];
  const crop = country && country.crops && country.crops[input.crop];
  if (!country || !type || !crop) return null;
  const structure = input.area * (country.struct[input.greenhouseType] || country.struct.steel_polythene);
  const groundPrep = input.area * country.ground_prep;
  const drip = input.area * country.irrigation_drip;
  const fertigation = input.area * country.fertigation;
  const inputs = input.area * country.initial_inputs;
  const borehole = input.waterSource === 'borehole' && input.isNewSetup ? input.area * country.irrigation_drip * 4 : 0;
  const setupTotal = structure + groundPrep + drip + fertigation + inputs + borehole;
  const production = input.area * crop.running * input.cyclesPerYear;
  let cover = 0;
  if (['wooden_polythene', 'steel_polythene', 'hydroponic_tunnel'].includes(input.greenhouseType)) {
    cover = input.area * country.polythene_replace_cost_per_m2 * type.coverReplaceMultiplier / type.coverLifespan;
  } else if (input.greenhouseType === 'shade_house') {
    cover = input.area * country.polythene_replace_cost_per_m2 * 0.65 / type.coverLifespan;
  } else if (input.greenhouseType === 'steel_polycarbonate') {
    cover = 0.3 * structure / type.coverLifespan;
  }
  const maintenance = 0.015 * structure;
  let water = 0;
  if (input.waterSource === 'borehole') water = 0.08 * production + (input.isNewSetup ? borehole / 15 : 0);
  else if (input.waterSource === 'rain') water = -0.08 * production;
  const runningTotal = Math.max(0, production + cover + maintenance + water);
  const yieldKg = input.area * crop.yield * input.cyclesPerYear;
  const revenueLow = yieldKg * crop.price.low;
  const revenueMid = yieldKg * crop.price.mid;
  const revenueHigh = yieldKg * crop.price.high;
  const netProfit = revenueMid - runningTotal;
  const roi = setupTotal > 0 ? netProfit / setupTotal * 100 : 0;
  const payback = netProfit > 0 ? setupTotal / netProfit : Infinity;
  const breakEvenKg = runningTotal / crop.price.mid;
  return {
    setup: { structure, groundPrep, drip, fertigation, inputs, borehole, total: setupTotal },
    running: { production, cover, maintenance, water, total: runningTotal },
    revenue: { yieldKg, yieldPerM2: crop.yield * input.cyclesPerYear, low: revenueLow, mid: revenueMid, high: revenueHigh },
    netProfit, roi, payback, breakEvenKg,
    breakEvenPerM2: input.area > 0 ? breakEvenKg / input.area : 0,
    currency: country.currency, symbol: country.symbol,
    openField: {
      yieldTotal: input.area * (cropMeta ? cropMeta.openFieldYieldPerM2 : 0),
      revenue: input.area * (cropMeta ? cropMeta.openFieldYieldPerM2 : 0) * crop.price.low,
      running: 0.42 * production,
      profit: input.area * (cropMeta ? cropMeta.openFieldYieldPerM2 : 0) * crop.price.low - 0.42 * production
    }
  };
}
function comparable(result) {
  return JSON.parse(JSON.stringify({
    setup: result.setup, running: result.running, revenue: result.revenue, netProfit: result.netProfit,
    roi: result.roi, payback: Number.isFinite(result.payback) ? result.payback : null,
    breakEvenKg: result.breakEvenKg, breakEvenPerM2: result.breakEvenPerM2,
    currency: result.country.currency, symbol: result.symbol, openField: result.openField
  }));
}

const rows = manifest.rows.filter(row => row.family === 'greenhouse');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
const { data, engine } = runtime();
const oracleRows = [];

assert.strictEqual(rows.length, 16);
assert.strictEqual(countries.length, 15);
assert.strictEqual(generator.CONTRACTS.greenhouse, contract);
assert.deepStrictEqual(generator.FAMILY_SIZES.greenhouse, { rows: 16, countries: 15 });
assert.ok(fs.existsSync(path.join(ROOT, 'engines/src/greenhouse-engine.js')));
assert.ok(fs.existsSync(path.join(ROOT, 'data/agriculture/greenhouse-data.js')));
Object.keys(data.types).forEach(key => assert.ok(contract.TYPES[key], `missing Swahili greenhouse type ${key}`));
Object.keys(data.crops).forEach(key => assert.ok(contract.CROPS[key], `missing Swahili crop ${key}`));

const hubHtml = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
assert.strictEqual((hubHtml.match(/<li><a href="\/sw\/kilimo\/greenhouse\//g) || []).length, 15);
assert.match(hubHtml, /FAOSTAT — bidhaa za mazao na mifugo<\/a>/);
assert.match(hubHtml, /ulipitiwa 2026/);
assert.match(hubHtml, /Kiwango cha uhakika/);
assert.match(hubHtml, /greenhouse-cost-estimator/);
assert.doesNotMatch(hubHtml, /&amp;amp;|â|Ã|Data sources:|For planning purposes|\b(?:Calculate|Download|Freshness|Confidence|Privacy|Results?)\b/);
oracleRows.push({ englishId: hub.english.id, englishRoute: hub.english.routeKey, swahiliRoute: hub.swahili.routeKey, countryCode: null, validOracle: false, invalidOracle: false, status: 'hub-route-proof' });

const typeIds = Object.keys(data.types);
const waterSources = Object.keys(contract.WATER);
for (const [index, row] of countries.entries()) {
  const code = row.country.code;
  const cropIds = Object.keys(data.countries[code].crops);
  const input = {
    countryCode: code,
    greenhouseType: typeIds[index % typeIds.length],
    area: 420 + index * 37,
    crop: cropIds[index % cropIds.length],
    cyclesPerYear: 1 + (index % 4),
    waterSource: waterSources[index % waterSources.length],
    isNewSetup: index % 2 === 0
  };
  const actual = engine.calculate(input);
  const expected = reference(input, data);
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');
  const french = fs.readFileSync(path.join(ROOT, row.french.file), 'utf8');
  const source = contract.sourceMetadata(row);

  assert.ok(actual, `${code} engine result missing`);
  assert.deepStrictEqual(comparable(actual), comparable({ ...expected, country: data.countries[code] }), `${code} formula drift`);
  assert.strictEqual(engine.calculate({ ...input, countryCode: 'XX' }), null);
  assert.strictEqual(engine.calculate({ ...input, crop: '__invalid__' }), null);
  assert.match(html, /^<!DOCTYPE html>\s*<html lang="sw"/);
  assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
  assert.doesNotMatch(html, /&amp;amp;|â|Ã|Data sources:|For planning purposes|All prices|\b(?:Calculate|Reset|Download|Share|Save|Privacy|Freshness|Confidence|Results?)\b/);
  assert.match(html, new RegExp(`<meta name="afrotools-country-id" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-source-jurisdiction" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-formula-jurisdiction" content="${code}">`));
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${row.swahili.route}">`));
  for (const [locale, route] of [['en', row.english.route], ['fr', row.french.route], ['sw', row.swahili.route]]) {
    assert.ok(html.includes(`<link rel="alternate" hreflang="${locale}" href="https://afrotools.com${route}">`));
  }
  assert.ok(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
  assert.ok(french.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
  assert.ok(html.includes(`src="/${row.artwork.file}"`));
  assert.ok(fs.existsSync(path.join(ROOT, row.artwork.file)));
  assert.ok(html.includes('/engines/greenhouse-engine.js'));
  assert.ok(html.includes('/data/agriculture/greenhouse-data.js'));
  assert.ok(html.includes('/assets/js/pages/sw-agriculture-greenhouse.js'));
  assert.ok(html.includes(escapeHtml(source.source)), `${code} complete named source list missing`);
  for (const named of source.source.split(',').map(value => value.trim()).filter(Boolean)) {
    assert.ok(html.includes(escapeHtml(named)), `${code} named source fragment missing: ${named}`);
  }
  assert.ok(html.includes(`Marejeo yaliyotajwa yana mwaka ${source.dataReviewed}`));
  assert.ok(html.includes('FAOSTAT — bidhaa za mazao na mifugo</a>'));
  assert.ok(html.includes('Kiwango cha uhakika'));
  assert.ok(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`));
  assert.ok(html.includes(contract.countryName(row)));
  oracleRows.push({
    englishId: row.english.id, englishRoute: row.english.routeKey, swahiliRoute: row.swahili.routeKey,
    countryCode: code, countryName: contract.countryName(row),
    engineOwner: 'engines/src/greenhouse-engine.js#calculate', dataOwners: ['data/agriculture/greenhouse-data.js'],
    currency: data.countries[code].currency, source: source.source, freshness: source.dataReviewed,
    validOracle: { input, expected: comparable({ ...expected, country: data.countries[code] }), actual: comparable(actual) },
    invalidOracle: {
      boundaries: ['area:min', 'area:max', 'area:required', 'cycles:min', 'cycles:max', 'cycles:integer', 'select:invalid'],
      controllerOwner: 'assets/js/pages/sw-agriculture-greenhouse.js', staleResultCleared: true, exportsDisabled: true
    }
  });
}

const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/sw-agriculture-greenhouse.js'), 'utf8');
assert.doesNotMatch(controller, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
assert.match(controller, /form\.addEventListener\('input',[\s\S]*clearResult/);
assert.match(controller, /form\.addEventListener\('change',[\s\S]*clearResult/);
assert.match(controller, /setActionsEnabled\(false\)/);
assert.match(controller, /navigator\.share/);

const report = { schemaVersion: 1, family: 'greenhouse', routes: 16, countryOracles: 15, rows: oracleRows };
if (process.env.SW_AGRI_ORACLE_OUTPUT) fs.writeFileSync(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ family: report.family, routes: report.routes, countryOracles: report.countryOracles }, null, 2));
