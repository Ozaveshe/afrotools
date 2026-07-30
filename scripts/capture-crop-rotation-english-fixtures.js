#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ROOT = path.resolve(__dirname, '..');
const OUTPUT = path.join(ROOT, 'tests/fixtures/crop-rotation-english-invariants.json');

function load() {
  const context = { window: {} };
  vm.createContext(context);
  for (const file of ['data/agriculture/country-index.js', 'engines/src/crop-rotation-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), 'utf8'), context, { filename: file });
  }
  return {
    countries: context.window.AfroTools.countryIndex,
    engine: context.window.AfroTools.CropRotationEngine,
  };
}
function capture() {
  const { countries, engine } = load();
  const goals = ['maximize_yield', 'restore_soil', 'minimize_pests', 'maximize_profit'];
  const soils = ['depleted', 'average', 'good', 'excellent'];
  const seasonCounts = [2, 3, 4, 6, 8];
  const scenarios = [];
  countries.forEach((country, countryIndex) => {
    const availableCrops = engine.getAvailableCrops(country.topCrops);
    goals.forEach((goal, goalIndex) => {
      const prevCrop = availableCrops[(countryIndex + goalIndex) % availableCrops.length];
      const input = {
        countryCode: country.code,
        prevCrop,
        seasons: seasonCounts[(countryIndex + goalIndex) % seasonCounts.length],
        goal,
        soilCondition: soils[(countryIndex + goalIndex) % soils.length],
        availableCrops,
      };
      const output = engine.calculate(input);
      assert.equal(output.success, true);
      scenarios.push({ country: { code: country.code, name: country.name, topCrops: country.topCrops }, input, output });
    });
  });
  return {
    schemaVersion: 1,
    owner: 'engines/src/crop-rotation-engine.js',
    dataOwner: 'data/agriculture/country-index.js',
    countries: countries.length,
    cropOrder: engine.getAllCrops().map(crop => crop.id),
    scenarios,
    invalid: engine.calculate({ prevCrop: 'unknown', seasons: 4 }),
  };
}
function run() {
  const fixture = capture();
  const json = `${JSON.stringify(fixture, null, 2)}\n`;
  if (process.argv.includes('--check')) {
    assert.equal(fs.readFileSync(OUTPUT, 'utf8'), json);
    console.log(`PASS ${fixture.scenarios.length} Crop Rotation English invariants across ${fixture.countries} countries`);
    return;
  }
  fs.writeFileSync(OUTPUT, json, 'utf8');
  console.log(`Wrote ${fixture.scenarios.length} Crop Rotation English invariants across ${fixture.countries} countries`);
}
if (require.main === module) run();
module.exports = { capture };
