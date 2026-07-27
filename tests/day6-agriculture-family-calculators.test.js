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

console.log('Day 6 Agriculture family calculator fixtures passed.');
