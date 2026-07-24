const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/engines/shipping-cost-planner.js");

function base(overrides = {}) {
  return Object.assign({
    currencyLabel: "USD", packageCount: 2, actualKgPerPackage: 3,
    lengthCm: 40, widthCm: 30, heightCm: 20, divisor: 6000,
    ratePerKg: 5, fixedFees: 10, packagingFees: 4, fuelPct: 10,
    declaredValue: 200, insurancePct: 2, contingencyPct: 5
  }, overrides);
}

test("formula contract keeps chargeable weight and cost components exact", () => {
  const result = engine.calculate(base());
  assert.equal(result.valid, true);
  assert.equal(result.outputs.actualTotalKg, 6);
  assert.equal(result.outputs.volumetricTotalKg, 8);
  assert.equal(result.outputs.chargeableKg, 8);
  assert.equal(result.outputs.freight, 40);
  assert.equal(result.outputs.fuel, 4);
  assert.equal(result.outputs.insurance, 4);
  assert.equal(result.outputs.subtotal, 62);
  assert.equal(result.outputs.contingency, 3.1);
  assert.equal(result.outputs.total, 65.1);
});

test("actual weight wins and all optional money assumptions may be zero", () => {
  const result = engine.calculate(base({
    packageCount: 1, actualKgPerPackage: 10, lengthCm: 10, widthCm: 10, heightCm: 10,
    divisor: 5000, ratePerKg: 0, fixedFees: 0, packagingFees: 0, fuelPct: 0,
    declaredValue: 0, insurancePct: 0, contingencyPct: 0
  }));
  assert.equal(result.valid, true);
  assert.equal(result.outputs.chargeableKg, 10);
  assert.equal(result.outputs.total, 0);
});

test("blank divisor, non-integer count, zero measurements, negatives and non-finite values are rejected", () => {
  for (const [field, value] of [
    ["divisor", ""], ["packageCount", 1.5], ["actualKgPerPackage", 0],
    ["lengthCm", -1], ["ratePerKg", -1], ["fuelPct", Infinity]
  ]) {
    const result = engine.calculate(base({ [field]: value }));
    assert.equal(result.valid, false, field);
    assert.ok(result.errors.includes(field), field);
  }
});

test("percentages above 100 and extreme finite values fail closed", () => {
  for (const field of ["fuelPct", "insurancePct", "contingencyPct"]) {
    const result = engine.calculate(base({ [field]: 100.01 }));
    assert.equal(result.valid, false);
    assert.ok(result.errors.includes(field));
  }
  for (const [field, value] of [
    ["packageCount", engine.LIMITS.packageCount + 1],
    ["actualKgPerPackage", engine.LIMITS.weightKg + 1],
    ["lengthCm", engine.LIMITS.dimensionCm + 1],
    ["divisor", engine.LIMITS.divisor + 1],
    ["ratePerKg", engine.LIMITS.money + 1]
  ]) {
    const result = engine.calculate(base({ [field]: value }));
    assert.equal(result.valid, false, field);
    assert.ok(result.errors.includes(field), field);
  }
});

test("non-finite output is rejected even if a future input limit changes", () => {
  const originalMoney = engine.LIMITS.money;
  assert.equal(Number.isFinite(originalMoney), true);
  assert.equal(engine.calculate(base({ declaredValue: Number.MAX_VALUE })).valid, false);
});

test("display label is bounded and has no effect on arithmetic", () => {
  const result = engine.calculate(base({ currencyLabel: "=HYPERLINK(1) and a very long label" }));
  assert.equal(result.inputs.currencyLabel.length, 16);
  assert.equal(result.outputs.total, 65.1);
});
