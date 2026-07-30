#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '..');
const FIXTURE_PATH = path.join(ROOT, 'tests', 'fixtures', 'poultry-roi-english-invariants.json');

function loadAcceptedRuntime() {
  const context = { window: {}, console };
  vm.createContext(context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'data/agriculture/poultry-data.js'), 'utf8'), context);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'engines/poultry-roi-engine.js'), 'utf8'), context);
  return context.window.AfroTools;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function buildFixtures() {
  const runtime = loadAcceptedRuntime();
  const modes = ['broilers', 'layers', 'indigenous', 'compare'];
  const managementLevels = ['backyard', 'smallholder', 'semi_commercial', 'commercial'];
  const housingTypes = ['simple', 'semi_commercial', 'commercial'];
  const cases = [];

  Object.keys(runtime.PoultryCosts).sort().forEach((countryCode, countryIndex) => {
    modes.forEach((mode, modeIndex) => {
      managementLevels.forEach((management, managementIndex) => {
        const input = {
          mode,
          countryCode,
          flockSize: [37, 250, 777][(countryIndex + modeIndex + managementIndex) % 3],
          management,
          cyclesPerYear: [3, 4, 6][(countryIndex + managementIndex) % 3],
          ownHouse: (countryIndex + modeIndex + managementIndex) % 2 === 0,
          housingType: housingTypes[(countryIndex + modeIndex) % housingTypes.length],
        };
        cases.push({
          id: `${countryCode}-${mode}-${management}`,
          input,
          countryData: runtime.PoultryCosts[countryCode],
          output: runtime.PoultryROIEngine.calculate(input, runtime.PoultryCosts[countryCode]),
        });
      });

      const customCountryData = clone(runtime.PoultryCosts[countryCode]);
      customCountryData.dayOldChick.broiler *= 1.07;
      customCountryData.dayOldChick.layer *= 0.93;
      customCountryData.dayOldChick.indigenous *= 1.11;
      customCountryData.feed_per_kg.starter *= 1.13;
      customCountryData.feed_per_kg.grower *= 0.91;
      customCountryData.feed_per_kg.finisher *= 1.04;
      customCountryData.feed_per_kg.layer_mash *= 1.09;
      customCountryData.labor_per_month *= 1.17;
      customCountryData.sellingPrice.broiler_per_bird *= 0.88;
      customCountryData.sellingPrice.egg_per_egg *= 1.16;
      customCountryData.sellingPrice.spent_layer_per_bird *= 0.84;
      customCountryData.sellingPrice.indigenous_live_per_bird *= 1.21;
      const customInput = {
        mode,
        countryCode,
        flockSize: 413,
        management: 'smallholder',
        cyclesPerYear: 5,
        ownHouse: false,
        housingType: 'semi_commercial',
      };
      cases.push({
        id: `${countryCode}-${mode}-custom-prices`,
        input: customInput,
        countryData: customCountryData,
        output: runtime.PoultryROIEngine.calculate(customInput, customCountryData),
      });
    });
  });

  return {
    schemaVersion: 1,
    source: [
      'engines/poultry-roi-engine.js',
      'data/agriculture/poultry-data.js',
    ],
    countries: Object.keys(runtime.PoultryCosts).sort(),
    cases,
  };
}

function main() {
  const expected = `${JSON.stringify(buildFixtures(), null, 2)}\n`;
  if (process.argv.includes('--check')) {
    assert.equal(fs.readFileSync(FIXTURE_PATH, 'utf8'), expected, 'Poultry ROI English invariants changed');
    console.log(`PASS ${JSON.parse(expected).cases.length} Poultry ROI English invariant cases`);
    return;
  }
  fs.mkdirSync(path.dirname(FIXTURE_PATH), { recursive: true });
  fs.writeFileSync(FIXTURE_PATH, expected, 'utf8');
  console.log(`Wrote ${JSON.parse(expected).cases.length} Poultry ROI English invariant cases`);
}

if (require.main === module) main();

module.exports = { buildFixtures, loadAcceptedRuntime };
