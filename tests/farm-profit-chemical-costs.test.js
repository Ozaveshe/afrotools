const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

test('explicit zero chemical costs override country defaults at the selected area', () => {
  const country = { currencySymbol: 'KSh', crops: [{ id: 'maize', baseYieldPerHa: 1.8, localMarketPrice: 40000 }] };
  const defaults = { agrochemicals: { herbicide_perHa: 3000, pesticide_perHa: 2500, fungicide_perHa: 2000 } };
  for (const filename of ['engines/src/farm-profit-engine.js', 'engines/farm-profit-engine.js']) {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', filename), 'utf8'), context);
    const engine = context.window.AfroTools.FarmProfitEngine;
    const calculate = (fields) => engine.calculate({ cropId: 'maize', farmSizeHa: 2, ...fields }, country, defaults);
    assert.equal(calculate({}).costs.agrochemicals, 15000);
    assert.equal(calculate({ herbicideCostPerHa: '0', fungicideCostPerHa: 0 }).costs.agrochemicals, 5000);
    const result = calculate({ herbicideCostPerHa: 0, pesticideCostPerHa: 0, fungicideCostPerHa: 0 });
    assert.equal(result.costs.agrochemicals, 0);
    assert.equal(result.netProfit, result.netRevenue - result.totalCost);
  }
});
