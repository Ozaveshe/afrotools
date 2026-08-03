'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const manifest = require('../data/localization/sw-agriculture-parity-manifest.json');
const contract = require('../scripts/lib/sw-agriculture-family-contracts/livestock-feed');
const generator = require('../scripts/build-sw-agriculture-family');

function runtime() {
  const sandbox = { window: { AfroTools: {} } };
  vm.createContext(sandbox);
  for (const file of ['data/agriculture/livestock-feed-data.js', 'engines/livestock-feed-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), sandbox, { filename: file });
  }
  return sandbox.window.AfroTools;
}
function round(value, digits = 0) {
  return Math.round(value * (10 ** digits)) / (10 ** digits);
}
function reference(input, data) {
  const profile = data[input.animalType].classes[input.animalClass];
  const price = data.prices[input.countryCode];
  const selected = input.selectedFeeds.filter(key => data.ingredients[key]);
  const groups = { roughage: [], energy: [], protein: [], mineral: [], additive: [] };
  selected.forEach(key => groups[data.ingredients[key].cat].push(key));
  const dryMatter = input.bodyWeight * profile.dmi_pct / 100;
  let roughagePct = profile.roughagePct || 0.6;
  const mineralPct = Math.min(0.015 * groups.mineral.length, 0.03);
  const additivePct = Math.min(0.005 * groups.additive.length, 0.01);
  let concentratePct = 1 - roughagePct - mineralPct - additivePct;
  if (!groups.roughage.length) { concentratePct += roughagePct; roughagePct = 0; }
  if (!groups.energy.length && !groups.protein.length) { roughagePct += concentratePct; concentratePct = 0; }
  let energyPct = 0.65 * concentratePct;
  let proteinPct = 0.35 * concentratePct;
  if (!groups.energy.length) { proteinPct += energyPct; energyPct = 0; }
  if (!groups.protein.length) { energyPct += proteinPct; proteinPct = 0; }
  const items = [];
  let providedProtein = 0;
  let providedTdn = 0;
  let dailyCost = 0;
  function allocate(keys, totalDryMatter) {
    if (!keys.length || totalDryMatter <= 0) return;
    const each = totalDryMatter / keys.length;
    keys.forEach(key => {
      const ingredient = data.ingredients[key];
      const fresh = each / (ingredient.dm / 100);
      const protein = (ingredient.cp || 0) * each / 100 * 1000;
      const tdn = (ingredient.tdn || 0) * each / 100 * 1000;
      const cost = fresh * (price[key] || 0);
      providedProtein += protein;
      providedTdn += tdn;
      dailyCost += cost;
      items.push({ id: key, freshKg: round(fresh, 2), dmKg: round(each, 2), cp_g: round(protein), tdn_g: round(tdn), cost: round(cost, 2) });
    });
  }
  allocate(groups.roughage, roughagePct * dryMatter);
  allocate(groups.energy, energyPct * dryMatter);
  allocate(groups.protein, proteinPct * dryMatter);
  allocate(groups.mineral, mineralPct * dryMatter);
  allocate(groups.additive, additivePct * dryMatter);
  const requiredProtein = dryMatter * profile.cp_pct / 100 * 1000;
  const requiredTdn = dryMatter * profile.tdn_pct / 100 * 1000;
  return {
    dmi: round(dryMatter, 2),
    req: { cp_g: round(requiredProtein), tdn_g: round(requiredTdn), me_mj: round(dryMatter * (profile.me_mj || 9), 1) },
    prov: { cp_g: round(providedProtein), tdn_g: round(providedTdn), cp_pct_diet: round(providedProtein / (10 * dryMatter), 1), tdn_pct_diet: round(providedTdn / (10 * dryMatter), 1) },
    balance: { cp_ok: providedProtein >= 0.9 * requiredProtein, tdn_ok: providedTdn >= 0.9 * requiredTdn },
    ration: items,
    costs: { dailyPerAnimal: round(dailyCost, 2), dailyTotal: round(dailyCost * input.numAnimals, 2), monthlyPerAnimal: round(dailyCost * 30, 2), monthlyTotal: round(dailyCost * input.numAnimals * 30, 2), annualTotal: round(dailyCost * input.numAnimals * 365) },
    currency: price.currency,
  };
}

const rows = manifest.rows.filter(row => row.family === 'livestock-feed');
const countries = rows.filter(row => row.country);
const hub = rows.find(row => !row.country);
const afroTools = runtime();
const oracleRows = [];

assert.strictEqual(rows.length, 16);
assert.strictEqual(countries.length, 15);
assert.strictEqual(generator.CONTRACTS['livestock-feed'], contract);
assert.deepStrictEqual(generator.FAMILY_SIZES['livestock-feed'], { rows: 16, countries: 15 });
assert.deepStrictEqual(contract.reciprocalLocales, ['en']);
assert.ok(fs.existsSync(path.join(ROOT, 'engines/src/livestock-feed-engine.js')));
assert.ok(fs.existsSync(path.join(ROOT, 'data/agriculture/livestock-feed-data.js')));
Object.keys(afroTools.LivestockFeedData.ingredients).forEach(key => assert.ok(contract.INGREDIENTS[key], `missing Swahili ingredient ${key}`));

const hubHtml = fs.readFileSync(path.join(ROOT, hub.swahili.file), 'utf8');
assert.strictEqual((hubHtml.match(/<li><a href="\/sw\/kilimo\/chakula-cha-mifugo\//g) || []).length, 15);
assert.match(hubHtml, /Mahitaji ya virutubisho ya NRC/);
assert.match(hubHtml, /FAO - uzalishaji na malisho ya mifugo<\/a>/);
assert.match(hubHtml, /bei tuli zilizopitiwa kwa rejea za 2024-2025; si data ya moja kwa moja/);
assert.match(hubHtml, /Kiwango cha uhakika/);
assert.match(hubHtml, /livestock-feed-calculator/);
assert.doesNotMatch(hubHtml, /&amp;amp;|â|Ã|\b(?:Calculate|Download|Freshness|Confidence|Privacy|Results?)\b/);
oracleRows.push({ englishId: hub.english.id, englishRoute: hub.english.routeKey, swahiliRoute: hub.swahili.routeKey, countryCode: null, validOracle: false, invalidOracle: false, status: 'hub-route-proof' });

const animalTypes = ['cattle', 'goat', 'sheep'];
for (const [index, row] of countries.entries()) {
  const code = row.country.code;
  const data = afroTools.LivestockFeedData;
  const price = data.prices[code];
  const animalType = animalTypes[index % animalTypes.length];
  const animalClass = Object.keys(data[animalType].classes)[index % Object.keys(data[animalType].classes).length];
  const selectedFeeds = Object.keys(data.ingredients).filter(key => (
    (data.ingredients[key].avail.includes(code) || data.ingredients[key].avail.includes('ALL')) && price[key] !== undefined
  ));
  const input = {
    animalType,
    animalClass,
    bodyWeight: animalType === 'cattle' ? 280 + index * 5 : 35 + index,
    numAnimals: 2 + index,
    selectedFeeds,
    maxBudget: index % 2 ? 0 : 1000000,
    countryCode: code,
  };
  const result = afroTools.LivestockFeedEngine.calculate(input, data);
  const expected = reference(input, data);
  const html = fs.readFileSync(path.join(ROOT, row.swahili.file), 'utf8');
  const english = fs.readFileSync(path.join(ROOT, row.english.file), 'utf8');

  assert.ok(result.ok, `${code} engine error`);
  const actual = JSON.parse(JSON.stringify({ dmi: result.dmi, req: result.req, prov: result.prov, balance: result.balance, ration: result.ration.map(item => ({ id: item.id, freshKg: item.freshKg, dmKg: item.dmKg, cp_g: item.cp_g, tdn_g: item.tdn_g, cost: item.cost })), costs: result.costs, currency: result.currency }));
  assert.deepStrictEqual(actual, expected, `${code} formula drift`);
  assert.match(html, /^<!DOCTYPE html>\s*<html\b[^>]*\blang="sw"/);
  assert.doesNotMatch(html, /<iframe\b|\bfetch\s*\(/i);
  assert.doesNotMatch(html, /&amp;amp;|â|Ã|\b(?:Calculate|Reset|Download|Share|Save|Privacy|Freshness|Confidence|Results?)\b/);
  assert.match(html, new RegExp(`<meta name="afrotools-country-id" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-source-jurisdiction" content="${code}">`));
  assert.match(html, new RegExp(`<meta name="afrotools-formula-jurisdiction" content="${code}">`));
  assert.ok(html.includes(`<link rel="canonical" href="https://afrotools.com${row.swahili.route}">`));
  for (const locale of [['en', row.english.route], ['fr', row.french.route], ['sw', row.swahili.route]]) {
    assert.ok(html.includes(`<link rel="alternate" hreflang="${locale[0]}" href="https://afrotools.com${locale[1]}">`));
  }
  assert.ok(english.includes(`hreflang="sw" href="https://afrotools.com${row.swahili.route}"`));
  assert.ok(html.includes(`src="/${row.artwork.file}"`));
  assert.ok(fs.existsSync(path.join(ROOT, row.artwork.file)));
  assert.ok(html.includes('/engines/livestock-feed-engine.js'));
  assert.ok(html.includes('/data/agriculture/livestock-feed-data.js'));
  assert.ok(html.includes('/assets/js/pages/sw-agriculture-livestock-feed.js'));
  assert.ok(html.includes('FAO - uzalishaji na malisho ya mifugo</a>'));
  assert.ok(html.includes('bei tuli zilizopitiwa kwa rejea za 2024-2025'));
  assert.ok(html.includes(`kitambulisho cha njia ni <code>${row.english.id}</code>`));
  assert.ok(html.includes(contract.countryName(row)));
  if (code === 'MA') {
    assert.match(html, /"spatialCoverage":\{"@type":"Country","name":"Moroko","identifier":"MA"\}/);
    assert.match(html, /"position":4,"name":"Moroko"/);
  }
  oracleRows.push({
    englishId: row.english.id, englishRoute: row.english.routeKey, swahiliRoute: row.swahili.routeKey,
    countryCode: code, countryName: contract.countryName(row), engineOwner: 'engines/src/livestock-feed-engine.js#calculate',
    dataOwners: ['data/agriculture/livestock-feed-data.js'], currency: price.currency,
    source: contract.SOURCE_LABEL, freshness: contract.DATA_REVIEWED,
    validOracle: { input, expected, actual: expected },
    invalidOracle: { boundaries: ['bodyWeight:min', 'bodyWeight:max', 'numAnimals:min', 'numAnimals:max', 'maxBudget:min', 'selectedFeeds:min'], controllerOwner: 'assets/js/pages/sw-agriculture-livestock-feed.js', staleResultCleared: true, exportsDisabled: true },
  });
}

const controller = fs.readFileSync(path.join(ROOT, 'assets/js/pages/sw-agriculture-livestock-feed.js'), 'utf8');
assert.doesNotMatch(controller, /\bfetch\s*\(|XMLHttpRequest|WebSocket|sendBeacon/);
assert.match(controller, /form\.addEventListener\('input',[\s\S]*clearResult/);
assert.match(controller, /form\.addEventListener\('change',[\s\S]*clearResult/);
assert.match(controller, /setActionsEnabled\(false\)/);
assert.match(controller, /navigator\.share/);

const report = { schemaVersion: 1, family: 'livestock-feed', routes: 16, countryOracles: 15, rows: oracleRows };
if (process.env.SW_AGRI_ORACLE_OUTPUT) fs.writeFileSync(path.resolve(process.env.SW_AGRI_ORACLE_OUTPUT), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify({ family: report.family, routes: report.routes, countryOracles: report.countryOracles }, null, 2));
