'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const data = require('../data/agriculture/farm-budget-data.json');
const engine = require('../engines/src/farm-budget-engine');

const context = { window: {} };
vm.createContext(context);
vm.runInContext(fs.readFileSync(path.resolve(__dirname, '../data/agriculture/farm-costs.js'), 'utf8'), context);
const farmCosts = context.window.AfroTools.farmCosts;
let scenarios = 0;
for (const countryCode of Object.keys(farmCosts)) {
  for (const crop of ['maize', 'cassava', 'tomato']) {
    for (const landMode of ['own', 'rent', 'communal']) {
      for (const laborMode of ['family', 'mixed', 'hired']) {
        for (const mechanizationMode of ['manual', 'ox', 'tractor']) {
          for (const financeMode of ['cash', 'loan']) {
            const input = {
              countryCode,
              crops: [{ crop, area: 0.5 }, { crop: 'groundnut', area: 2.25 }],
              landMode,
              laborMode,
              mechanizationMode,
              financeMode,
              startMonth: 4,
              rentOverride: 1234,
              loanRate: 17,
              loanTerm: 9,
            };
            const result = engine.calculate(input, { data, farmCosts });
            assert.equal(result.ok, true);
            assert.equal(result.cropLines.length, 2);
            assert.equal(result.totals.area, 2.75);
            assert.equal(result.totalBudget, result.subtotal + result.contingency + result.loanInterest);
            assert.equal(result.profit, result.totals.revenue - result.totalBudget);
            assert.equal(result.cashflow.length, 6);
            assert.equal(result.scenarios.length, 4);
            assert.ok(Number.isFinite(result.breakEvenYieldTonnesHa));
            scenarios += 1;
          }
        }
      }
    }
  }
}
assert.equal(engine.calculate({}, { data, farmCosts }).status, 'invalid-input');
assert.equal(engine.calculate({}, {}).status, 'missing-data');
console.log(JSON.stringify({ tool: 'farm-budget', countries: Object.keys(farmCosts).length, scenarios, status: 'passed' }, null, 2));
