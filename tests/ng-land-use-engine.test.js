const assert = require('assert');
const engine = require('../engines/src/ng-land-use-engine.js');

const assessed = engine.calculate({
  assessmentDate: '2026-07-23',
  mode: 'assessed',
  assessedValue: 50000000,
  chargeRatePct: 0.5,
  discountRatePct: 10
});
assert.strictEqual(assessed.ok, true);
assert.strictEqual(assessed.assessedValue, 50000000);
assert.strictEqual(assessed.grossCharge, 250000);
assert.strictEqual(assessed.discountAmount, 25000);
assert.strictEqual(assessed.payable, 225000);
assert.strictEqual(assessed.monthlyPlanningEquivalent, 18750);

const components = engine.calculate({
  assessmentDate: '2026-07-23',
  mode: 'components',
  landArea: 600,
  landRate: 100000,
  buildingArea: 300,
  buildingRate: 200000,
  depreciationPct: 80,
  reliefFactorPct: 90,
  chargeRatePct: 0.5,
  discountRatePct: 0
});
assert.strictEqual(components.ok, true);
assert.strictEqual(components.components.landComponent, 60000000);
assert.strictEqual(components.components.buildingComponent, 48000000);
assert.strictEqual(components.components.valueBeforeRelief, 108000000);
assert.strictEqual(components.assessedValue, 97200000);
assert.strictEqual(components.grossCharge, 486000);
assert.strictEqual(components.payable, 486000);

const maximumRate = engine.calculate({
  assessmentDate: '2026-07-23',
  mode: 'assessed',
  assessedValue: 1000000,
  chargeRatePct: 3.5,
  discountRatePct: ''
});
assert.strictEqual(maximumRate.payable, 35000);

assert.strictEqual(engine.calculate({
  assessmentDate: '2026-07-24',
  mode: 'assessed',
  assessedValue: 1,
  chargeRatePct: 1
}).error, 'unsupported_date');
assert.strictEqual(engine.calculate({
  assessmentDate: '2026-07-23',
  mode: 'assessed',
  assessedValue: 1,
  chargeRatePct: 3.5001
}).error, 'invalid_charge_rate');
assert.strictEqual(engine.calculate({
  assessmentDate: '2026-07-23',
  mode: 'assessed',
  assessedValue: 0,
  chargeRatePct: 1
}).error, 'invalid_assessed_value');
assert.strictEqual(engine.calculate({
  assessmentDate: '2026-07-23',
  mode: 'components',
  landArea: 0,
  landRate: 0,
  buildingArea: 0,
  buildingRate: 0,
  depreciationPct: 100,
  reliefFactorPct: 100,
  chargeRatePct: 1
}).error, 'invalid_components_total');

console.log('Nigeria Land Use Charge engine: 19 checks passed');
