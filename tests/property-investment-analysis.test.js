'use strict';
const assert = require('assert');
const engine = require('../assets/js/engines/property-investment-analysis.js');

function close(actual, expected, label, tolerance = 1e-10) {
  assert.ok(Math.abs(actual - expected) <= tolerance, `${label}: expected ${expected}, got ${actual}`);
}

const analysis = engine.analyse({
  purchasePrice: 10000000,
  buyingCosts: 500000,
  improvements: 300000,
  salePrice: 13500000,
  sellingCosts: 675000,
  taxPaid: 0,
  grossRent: 3000000,
  vacancyLoss: 250000,
  operatingExpenses: 900000,
  financingCosts: 0,
  yearsHeld: 5
});

assert.strictEqual(analysis.propertyBasis, 10800000);
assert.strictEqual(analysis.capitalPriceChange, 3500000);
assert.strictEqual(analysis.netOperatingCashFlow, 1850000);
assert.strictEqual(analysis.netSaleProceeds, 12825000);
assert.strictEqual(analysis.totalProfit, 3875000);
close(analysis.totalRoi, 3875000 / 10800000, 'total ROI');
close(analysis.simpleAverageAnnualRoi, analysis.totalRoi / 5, 'simple average annual ROI');
close(analysis.grossRentalYield, 600000 / 10000000, 'gross rental yield');
close(analysis.netRentalYield, 370000 / 10800000, 'net rental yield');
assert.strictEqual(analysis.totalCashInflows - analysis.totalCashOutflows, analysis.totalProfit);

const loss = engine.analyse({
  purchasePrice: 1000, buyingCosts: 100, improvements: 0, salePrice: 800,
  sellingCosts: 50, taxPaid: 0, grossRent: 0, vacancyLoss: 0,
  operatingExpenses: 100, financingCosts: 20, yearsHeld: 2
});
assert.ok(loss.totalProfit < 0);
assert.ok(loss.totalRoi < 0);
assert.ok(loss.netRentalYield < 0);

assert.throws(() => engine.analyse({ purchasePrice: 0 }), /purchasePrice/);
assert.throws(() => engine.analyse({
  purchasePrice: 1000, buyingCosts: 0, improvements: 0, salePrice: 1000,
  sellingCosts: 0, taxPaid: 0, grossRent: 100, vacancyLoss: 101,
  operatingExpenses: 0, financingCosts: 0, yearsHeld: 1
}), /vacancyLoss cannot exceed grossRent/);
assert.throws(() => engine.analyse({
  purchasePrice: 1000, buyingCosts: 0, improvements: 0, salePrice: 100,
  sellingCosts: 80, taxPaid: 30, grossRent: 0, vacancyLoss: 0,
  operatingExpenses: 0, financingCosts: 0, yearsHeld: 1
}), /cannot exceed salePrice/);
assert.throws(() => engine.analyse({
  purchasePrice: 1000, buyingCosts: 0, improvements: 0, salePrice: 1000,
  sellingCosts: 0, taxPaid: 0, grossRent: 0, vacancyLoss: 0,
  operatingExpenses: 0, financingCosts: 0, yearsHeld: 0
}), /between one month and 100 years/);

assert.match(engine.formulaParameters.simpleAverageAnnualRoi, /not CAGR or IRR/);
assert.match(engine.formulaParameters.financeBoundary, /principal/);
console.log('property-investment-analysis.test.js passed');
