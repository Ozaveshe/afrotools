const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { test } = require('node:test');

test('Uganda monthly irrigation totals reconcile at one and two hectares for every method', () => {
  const sandbox = vm.createContext({ window: {} });
  for (const file of ['data/agriculture/crop-database.js', 'data/agriculture/ug-agri-data.js', 'engines/irrigation-engine.js']) {
    vm.runInContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), sandbox);
  }
  const { countryData, cropDatabase, IrrigationEngine } = sandbox.window.AfroTools;
  const region = countryData.regions[0];
  const crop = countryData.crops.find(crop => crop.id === 'coffee_robusta');
  for (const farmSizeHa of [1, 2]) {
    for (const irrigationMethod of Object.keys(IrrigationEngine.METHOD_EFFICIENCY)) {
      const result = IrrigationEngine.calculate({ cropId: crop.id, regionId: region.id, month: 1,
        growthStage: 'flowering', irrigationMethod, farmSizeHa }, countryData, cropDatabase.crops);
      const rain = region.monthlyRainfall[0];
      const effectiveRain = rain <= 250 ? rain * (125 - 0.2 * rain) / 125 : 125 + 0.1 * rain;
      const netDepth = Math.max(0, result.eto * result.kc - effectiveRain / 30);
      const netVolume = netDepth * 30 * farmSizeHa * 10;
      const selected = result.methodComparison.find(row => row.isCurrent);
      const expected = Math.round(netVolume / result.efficiency);
      assert.equal(result.monthVolume_m3, expected);
      assert.equal(selected.waterUsed_m3, expected);
      assert.equal(result.waterLost_m3, expected - Math.round(netVolume));
      assert.equal(selected.waterWasted_m3, result.waterLost_m3);
    }
  }
});
