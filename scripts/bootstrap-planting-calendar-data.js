#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const ENGLISH = path.join(ROOT, 'tools', 'planting-calendar', 'index.html');
const JSON_FILE = path.join(ROOT, 'data', 'agriculture', 'planting-calendar-data.json');
const JS_FILE = path.join(ROOT, 'data', 'agriculture', 'planting-calendar-data.js');
const BOOTSTRAP = process.argv.includes('--bootstrap');
const CHECK = process.argv.includes('--check');

if (BOOTSTRAP === CHECK) throw new Error('Choose exactly one mode: --bootstrap or --check.');

function extractLegacyData() {
  const html = fs.readFileSync(ENGLISH, 'utf8');
  const match = html.match(/<script>\s*(const MONTHS=\[[\s\S]*?const ZONES=\{[\s\S]*?\n\};)\s*\nfunction pickCountry\(\)/);
  assert(match, 'Legacy Planting Calendar dataset was not found in the English page');
  const context = {};
  vm.createContext(context);
  vm.runInContext(`${match[1]}\nglobalThis.__DATA__={months:MONTHS,zones:ZONES,bimodalZones:['forest','highland','coastal-ea']};`, context);
  return JSON.parse(JSON.stringify(context.__DATA__));
}

function browserSource(data) {
  return `(function(root){'use strict';root.AfroTools=root.AfroTools||{};root.AfroTools.PlantingCalendarData=${JSON.stringify(data)};})(typeof window!=='undefined'?window:globalThis);\n`;
}

if (BOOTSTRAP) {
  const data = extractLegacyData();
  fs.writeFileSync(JSON_FILE, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.writeFileSync(JS_FILE, browserSource(data), 'utf8');
  console.log(`Bootstrapped ${Object.keys(data.zones).length} exact planting zones from the accepted English page`);
} else {
  const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
  assert.equal(Object.keys(data.zones).length, 7);
  assert.equal(data.months.length, 12);
  for (const [zone, crops] of Object.entries(data.zones)) {
    for (const [crop, months] of Object.entries(crops)) {
      assert.equal(months.length, 12, `${zone}/${crop} must have 12 months`);
      assert.ok(months.every(value => Number.isInteger(value) && value >= 0 && value <= 3), `${zone}/${crop} has an unknown status`);
    }
  }
  assert.equal(fs.readFileSync(JS_FILE, 'utf8'), browserSource(data));
  console.log(`PASS ${Object.keys(data.zones).length} planting zones and browser data output`);
}
