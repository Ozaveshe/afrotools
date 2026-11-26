'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const test = require('node:test');

test('Nigeria country harvest uses crop, region, variety and irrigation', () => {
  const window = {};
  const context = vm.createContext({ window });
  for (const file of ['data/agriculture/ng-agri-data.js', 'data/agriculture/crop-growth-data.js', 'engines/src/country-harvest-date-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
  }
  const { CountryHarvestDateEngine, countryData, cropGrowthData } = window.AfroTools;
  for (const [irrigation, adjustedDays, harvestDate] of [
    ['rainfed', 324, '9 November 2027'],
    ['irrigated', 309, '25 October 2027'],
  ]) {
    const inputs = { plantingDate: new Date(2026, 11, 20, 12), cropId: 'cassava', regionId: 'ng_sw', variety: 'medium', irrigation };
    const result = CountryHarvestDateEngine.calculate(inputs, countryData, cropGrowthData);
    assert.equal(result.baseDays, 300);
    assert.equal(result.adjustedDays, adjustedDays);
    assert.equal(result.harvestDateStr, harvestDate);
    assert.ok(result.harvestWindowStart < result.harvestDate);
    assert.ok(result.harvestWindowEnd > result.harvestDate);
    assert.ok(result.stages.length > 0);
  }
});
