const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

const country = { crops: [{ id: 'maize', baseYieldPerHa: 1, localMarketPrice: 1000 }] };
const defaults = {
  transport: { farmToMarket_perTonne_perKm: 2, marketFees_percentOfSale: 3 },
  storage: { perTonne_perMonth: 4 },
  finance: { averageInterestRate_percent: 5 }
};
const input = { cropId: 'maize', farmSizeHa: 2, yieldPerHa: 3, marketPricePerTonne: 1000, storageMonths: 1, loanAmount: 100 };

for (const file of ['engines/src/farm-profit-engine.js', 'engines/farm-profit-engine.js']) {
  test(file + ' preserves explicit zero and defaults absent rates', () => {
    const context = { window: {} };
    vm.runInNewContext(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), context);
    const costs = fields => context.window.AfroTools.FarmProfitEngine.calculate({ ...input, ...fields }, country, defaults).costs;
    const defaultCosts = costs({});
    assert.equal(defaultCosts.transport, 240);
    assert.equal(defaultCosts.marketingFees, 180);
    assert.equal(defaultCosts.storage, 24);
    assert.equal(defaultCosts.finance, 5);
    assert.equal(costs({ distanceToMarket: '' }).transport, 240);
    assert.equal(costs({ marketFeesPct: 'invalid' }).marketingFees, 180);
    for (const zero of [0, '0']) {
      assert.equal(costs({ distanceToMarket: zero, transportCostPerTonneKm: 2 }).transport, 0);
      assert.equal(costs({ distanceToMarket: 20, transportCostPerTonneKm: zero }).transport, 0);
      assert.equal(costs({ marketFeesPct: zero }).marketingFees, 0);
      assert.equal(costs({ storageCostPerTonneMonth: zero }).storage, 0);
      assert.equal(costs({ loanInterestPct: zero }).finance, 0);
    }
  });
}
