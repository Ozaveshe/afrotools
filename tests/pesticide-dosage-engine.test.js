'use strict';

const assert = require('node:assert/strict');
const engine = require('../engines/src/pesticide-dosage-engine');

const data = {
  sprayers: {
    knapsack: { tankSize: 16 },
    motorized: { tankSize: 20 },
    boom: { tankSize: 600 },
  },
};
const defaults = {
  knapsack: { water: 250 },
  motorized: { water: 175 },
  boom: { water: 150 },
};
let scenarios = 0;
for (const unitLabel of ['L/ha', 'mL/ha', 'kg/ha', 'g/ha']) {
  for (const sprayerKey of Object.keys(data.sprayers)) {
    for (const areaHa of [0.1, 1, 2.75, 25]) {
      for (const rate of [0.3, 2.5, 750]) {
        const result = engine.calculate({
          kind: 'spray',
          rate,
          unitLabel,
          areaHa,
          sprayerKey,
          sprayerDefaults: defaults,
          waterPerHa: '',
          pricePerUnit: 1500,
          currency: 'XOF',
          reentryHours: 12,
          preHarvestDays: 7,
        }, data);
        const ratePerHa = unitLabel === 'mL/ha' || unitLabel === 'g/ha' ? rate / 1000 : rate;
        assert.equal(result.ok, true);
        assert.equal(result.ratePerHa, ratePerHa);
        assert.equal(result.totalProduct, ratePerHa * areaHa);
        assert.equal(result.totalWater, defaults[sprayerKey].water * areaHa);
        assert.equal(
          result.tankLoads,
          Math.ceil(result.totalWater / data.sprayers[sprayerKey].tankSize)
        );
        assert.equal(result.productPerTank, result.totalProduct / result.tankLoads);
        assert.equal(result.totalCost, result.totalProduct * 1500);
        scenarios += 1;
      }
    }
  }
}
for (const unit of ['g', 'mL']) {
  for (const seedKg of [0.5, 25, 250, 1000]) {
    const result = engine.calculateSeedTreatment({
      rate: 3,
      unit,
      seedKg,
      reentryHours: 12,
      preHarvestDays: 0,
    });
    assert.equal(result.totalProduct, 3 * seedKg);
    assert.equal(result.displayUnit, result.totalProduct >= 1000 ? (unit === 'g' ? 'kg' : 'L') : unit);
    scenarios += 1;
  }
}
assert.equal(engine.calculateSpray({}, data).status, 'invalid-input');
assert.equal(engine.calculateSeedTreatment({}).status, 'invalid-input');
console.log(JSON.stringify({
  tool: 'pesticide-dosage-calculator',
  scenarios,
  status: 'passed',
}, null, 2));
