'use strict';
const assert = require('node:assert/strict');
const data = require('../data/agriculture/warehouse-receipt-data');
const engine = require('../engines/src/warehouse-receipt-engine');
let count = 0;
for (const [countryCode, country] of Object.entries(data.countries)) {
  for (const commodity of Object.keys(data.commodities)) {
    for (const quantityTonnes of [0.5, 5, 20, 125.75]) {
      const input = {
        countryCode, commodity, quantityTonnes, harvestPricePerTonne: 85000,
        ltvPct: country.ltv, annualRatePct: country.rate, periodMonths: 4,
        storagePerTonneMonth: country.storage, insuranceAnnualPct: country.insurance,
        handlingPerTonne: country.handling, priceIncreasePct: data.commodities[commodity].increase,
      };
      const result = engine.calculate(input, data);
      assert.equal(result.ok, true);
      assert.equal(result.grainValue, quantityTonnes * 85000);
      assert.ok(Math.abs(result.loanAmount - result.grainValue * country.ltv / 100) < 1e-7);
      assert.equal(result.wrsGain, result.netProceeds - result.harvestValue);
      count += 1;
    }
  }
}
assert.equal(engine.calculate({}, data).status, 'missing-country');
assert.equal(engine.calculate({ countryCode: 'NG', quantityTonnes: 0, harvestPricePerTonne: 1 }, data).status, 'missing-quantity');
assert.equal(engine.calculate({ countryCode: 'NG', quantityTonnes: 1, harvestPricePerTonne: 0 }, data).status, 'missing-price');
console.log(`PASS ${count} Warehouse Receipt engine scenarios`);
