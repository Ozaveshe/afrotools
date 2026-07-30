#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const ENGLISH = path.join(ROOT, 'agriculture', 'farm-budget', 'index.html');
const JSON_FILE = path.join(ROOT, 'data', 'agriculture', 'farm-budget-data.json');
const JS_FILE = path.join(ROOT, 'data', 'agriculture', 'farm-budget-data.js');
const BOOTSTRAP = process.argv.includes('--bootstrap');
const CHECK = process.argv.includes('--check');
if (BOOTSTRAP === CHECK) throw new Error('Choose exactly one mode: --bootstrap or --check.');

function extract() {
  const html = fs.readFileSync(ENGLISH, 'utf8');
  const match = html.match(/(var MONTHS = \[[\s\S]*?var MARKET_PRICE_T = \{[\s\S]*?\n\};)\s*\n\s*function getCountryCosts/);
  assert(match, 'Farm Budget embedded data was not found');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[1]}\nglobalThis.__DATA__={months:MONTHS,seedPricePerKg:SEED_PRICE_PER_KG,seedRate:SEED_RATE,plantingMaterialCostPerHa:PLANTING_MATERIAL_COST_PER_HA,fertilizerRateKgHa:FERT_RATE_KG_HA,fertilizerPricePerKg:FERT_PRICE_MULT,yieldTonnesHa:YIELD_THA,marketPricePerTonne:MARKET_PRICE_T};`, context);
  return JSON.parse(JSON.stringify(context.__DATA__));
}
function browserSource(data) {
  return `(function(root){'use strict';root.AfroTools=root.AfroTools||{};root.AfroTools.FarmBudgetData=${JSON.stringify(data)};})(typeof window!=='undefined'?window:globalThis);\n`;
}
if (BOOTSTRAP) {
  const data = extract();
  fs.writeFileSync(JSON_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.writeFileSync(JS_FILE, browserSource(data), 'utf8');
  console.log(`Bootstrapped Farm Budget data for ${Object.keys(data.seedRate).length} crops`);
} else {
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  assert.equal(data.months.length, 12);
  assert.equal(Object.keys(data.seedRate).length, 17);
  assert.equal(Object.keys(data.fertilizerRateKgHa).length, 17);
  assert.equal(Object.keys(data.yieldTonnesHa).length, 17);
  assert.equal(fs.readFileSync(JS_FILE, 'utf8'), browserSource(data));
  console.log('PASS exact Farm Budget embedded data output');
}
