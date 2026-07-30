#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const ENGLISH = path.join(ROOT, 'tools', 'fertilizer-calc', 'index.html');
const JSON_FILE = path.join(ROOT, 'data', 'agriculture', 'fertilizer-calc-data.json');
const JS_FILE = path.join(ROOT, 'data', 'agriculture', 'fertilizer-calc-data.js');
const BOOTSTRAP = process.argv.includes('--bootstrap');
const CHECK = process.argv.includes('--check');
if (BOOTSTRAP === CHECK) throw new Error('Choose exactly one mode: --bootstrap or --check.');

function extractLegacyData() {
  const html = fs.readFileSync(ENGLISH, 'utf8');
  const match = html.match(/<script>\s*(var CROPS=\{[\s\S]*?var MICRO_TIPS=\{[\s\S]*?\n\};)\s*\n\s*function calculate\(\)/);
  assert(match, 'Legacy Fertilizer Calculator dataset was not found');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[1]}\nglobalThis.__DATA__={crops:CROPS,soilMultipliers:SOIL_MULT,costs:COSTS,microTips:MICRO_TIPS};`, context);
  return JSON.parse(JSON.stringify(context.__DATA__));
}

function browserSource(data) {
  return `(function(root){'use strict';root.AfroTools=root.AfroTools||{};root.AfroTools.FertilizerCalcData=${JSON.stringify(data)};})(typeof window!=='undefined'?window:globalThis);\n`;
}

if (BOOTSTRAP) {
  const data = extractLegacyData();
  fs.writeFileSync(JSON_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.writeFileSync(JS_FILE, browserSource(data), 'utf8');
  console.log(`Bootstrapped ${Object.keys(data.crops).length} crops and ${Object.keys(data.costs).length} currency records`);
} else {
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  assert.equal(Object.keys(data.crops).length, 22);
  assert.equal(Object.keys(data.soilMultipliers).length, 5);
  assert.equal(Object.keys(data.costs).length, 7);
  assert.equal(Object.keys(data.microTips).length, 22);
  assert.equal(fs.readFileSync(JS_FILE, 'utf8'), browserSource(data));
  for (const crop of Object.values(data.crops)) {
    assert.deepEqual(Object.keys(crop.npk), ['low', 'medium', 'high']);
    assert.deepEqual(Object.keys(crop.yield), ['low', 'medium', 'high']);
    assert.ok(crop.schedule.length > 0);
  }
  console.log('PASS exact Fertilizer Calculator data output');
}
