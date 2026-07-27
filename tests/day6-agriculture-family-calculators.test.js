const assert = require('assert');
const calculators = require('../assets/js/pages/day6-agriculture-family-calculators.js');

assert.match(
  calculators.calculate('crop-yield-estimator', { areaHa: 2, yieldPerHa: 3.5, lossPct: 10 }),
  /6\.30 tonnes/
);
assert.match(
  calculators.calculate('fertilizer-calculator', {
    areaHa: 2, rateKgHa: 200, bagKg: 50, bagPrice: 35000, currency: 'NGN'
  }),
  /8 bags.*NGN 280,000/
);
assert.match(
  calculators.calculate('irrigation-calculator', {
    areaHa: 1.5, depthMm: 25, efficiencyPct: 75, cycles: 4
  }),
  /2,000\.0 m3/
);
assert.match(
  calculators.calculate('farm-profit-calculator', {
    harvestKg: 5000, pricePerKg: 450, variableCosts: 1200000, fixedCosts: 300000, currency: 'NGN'
  }),
  /NGN 750,000.*33\.3%/
);
assert.match(
  calculators.calculate('seed-rate-calculator', {
    areaHa: 2, rateKgHa: 25, germinationPct: 90, reservePct: 5
  }),
  /58\.3 kg/
);
assert.match(
  calculators.calculate('fish-farming-roi', {
    stock: 1000, survivalPct: 85, harvestWeightKg: 1.2, pricePerKg: 2200,
    totalCosts: 1600000, currency: 'NGN'
  }),
  /1,020\.0 kg.*NGN 644,000/
);
assert.match(
  calculators.calculate('greenhouse-cost-estimator', {
    areaM2: 240, costPerM2: 18000, contingencyPct: 12, currency: 'NGN'
  }),
  /NGN 4,838,400/
);
assert.match(
  calculators.calculate('cassava-processing-calculator', {
    rawCost: 250000, yieldKg: 650, sellPrice: 650, otherCost: 90000, currency: 'NGN'
  }),
  /NGN 82,500.*19\.5%/
);
assert.match(
  calculators.calculate('farm-loans-hub', {
    monthlyRevenue: 650000, repayment: 180000, collateral: 'no', currency: 'NGN'
  }),
  /27\.7%.*not an eligibility or approval result/
);
assert.match(
  calculators.calculate('crop-insurance', {
    farmValue: 750000, premiumRate: 5, excess: 10, currency: 'NGN'
  }),
  /NGN 37,500.*NGN 75,000/
);
assert.match(
  calculators.calculate('farm-payroll-calculator', {
    workers: 12, dailyWage: 3500, days: 20, currency: 'NGN'
  }),
  /NGN 840,000/
);
assert.match(
  calculators.calculate('livestock-feed-calculator', {
    animals: 25, kgPerDay: 2.5, feedPrice: 420, days: 30, currency: 'NGN'
  }),
  /1,875\.0 kg.*NGN 787,500/
);
assert.match(
  calculators.calculate('poultry-roi-calculator', {
    birds: 500, feedCost: 1200000, otherCosts: 800000, salePrice: 6500, mortality: 5, currency: 'NGN'
  }),
  /475 birds.*NGN 1,087,500/
);
assert.match(
  calculators.calculate('vaccination-schedule', {
    animals: 40, doseCost: 650, visits: 2, currency: 'NGN'
  }),
  /80 dose events.*NGN 52,000.*does not set a vaccination schedule/
);
assert.match(
  calculators.calculate('harvest-date-estimator', {
    plantingDate: '2026-04-01', crop: 'maize', maturityDays: 110, weatherRisk: 'medium'
  }),
  /July 20, 2026/
);
assert.match(
  calculators.calculate('input-prices', {
    priceA: 18500, transportA: 0, priceB: 17200, transportB: 2500, currency: 'NGN'
  }),
  /Supplier A landed unit cost NGN 18,500.*Supplier B NGN 19,700.*NGN 1,200/
);

assert.match(
  calculators.validate({ checkValidity: () => true }, { mortality: 101 }),
  /Mortality must be between/
);
assert.match(
  calculators.validate({ checkValidity: () => true }, { plantingDate: 'not-a-date' }),
  /valid planting date/
);

console.log('Day 6 Agriculture family calculator fixtures passed for all 16 maintained entry workflows.');
