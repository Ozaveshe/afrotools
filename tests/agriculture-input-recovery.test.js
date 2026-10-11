'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
let checks = 0;
for (const code of fs.readdirSync(path.join(root, 'data/agriculture')).filter(f => /^[a-z]{2}-agri-data\.js$/.test(f))) {
  const context = vm.createContext({ window: { AfroTools: {} } });
  for (const file of ['data/agriculture/crop-database.js', 'data/agriculture/seed-data.js', 'data/agriculture/seed-data-extension.js', `data/agriculture/${code}`, ...['irrigation', 'seed-rate', 'fertilizer', 'crop-yield'].map(f => `engines/src/${f}-engine.js`)]) {
    vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8'), context, { filename: file });
  }
  const api = context.window.AfroTools, country = api.countryData;
  const input = { cropId: 'maize', regionId: country.regions[0].id, farmSizeHa: 1, irrigationMethod: 'furrow', month: 0, growthStage: 'flowering', plantingMethod: 'direct', seedQuality: 'improved', fieldConditions: 'average', intercrop: 'sole', soilType: 'loamy' };
  const calls = [
    p => api.IrrigationEngine.calculate(p, country, api.cropDatabase.crops),
    p => api.SeedRateEngine.calculate(p, api.seedData, code.slice(0, 2).toUpperCase(), country),
    p => api.FertilizerEngine.calculate(p, country, api.cropDatabase),
    p => api.CropYieldEngine.calculate(p, country, api.cropDatabase)
  ];
  for (const calculate of calls) for (const farmSizeHa of ['', ' ', 0, -1, Infinity, NaN, 'abc', null, undefined]) {
    assert.equal(calculate({ ...input, farmSizeHa }).error, true, `${code}: invalid area ${farmSizeHa}`); checks++;
  }
  for (const field of ['rowSpacing_cm', 'plantSpacing_cm', 'seedsPerHole']) for (const value of [0, -1, Infinity, 'abc']) {
    assert.equal(calls[1]({ ...input, [field]: value }).error, true); checks++;
  }
  assert.equal(calls[1]({ ...input, seedsPerHole: 1.5 }).error, true); checks++;
  for (const field of ['organicMatter', 'P_ppm', 'K_ppm']) for (const value of [-1, Infinity, 'abc']) {
    assert.equal(calls[2]({ ...input, soilTest: { [field]: value } }).error, true); checks++;
  }
  for (const value of [0, -1, Infinity, 'abc']) { assert.equal(calls[2]({ ...input, targetYieldPerHa: value }).error, true); checks++; }
  for (const month of [-1, 13, 1.5, Infinity]) { assert.equal(calls[0]({ ...input, month }).error, true); checks++; }
  assert.equal(calls[0]({ ...input, irrigationMethod: 'unknown' }).error, true); checks++;
}
console.log(`Agriculture invalid-input regression: ${checks} checks passed.`);
