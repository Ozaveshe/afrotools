const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../assets/js/engines/discount-planner.js");

function fixture(overrides = {}) {
  return Object.assign({
    unitPrice: 100,
    quantity: 2,
    discounts: [20, 10],
    taxPct: 15,
    currencyLabel: "USD"
  }, overrides);
}

test("sequential discounts, tax and quantity keep distinct totals", () => {
  const result = engine.calculate(fixture());
  assert.equal(result.valid, true);
  assert.equal(result.outputs.originalSubtotal, 200);
  assert.ok(Math.abs(result.outputs.discountedUnitPrice - 72) < 1e-10);
  assert.ok(Math.abs(result.outputs.discountedSubtotal - 144) < 1e-10);
  assert.ok(Math.abs(result.outputs.savings - 56) < 1e-10);
  assert.ok(Math.abs(result.outputs.effectiveDiscountPct - 28) < 1e-10);
  assert.ok(Math.abs(result.outputs.taxAmount - 21.6) < 1e-10);
  assert.ok(Math.abs(result.outputs.finalTotal - 165.6) < 1e-10);
});

test("tax never changes pre-tax savings or effective discount", () => {
  const result = engine.calculate(fixture({ quantity: 1, discounts: [10], taxPct: 20 }));
  assert.equal(result.outputs.finalTotal, 108);
  assert.equal(result.outputs.savings, 10);
  assert.ok(Math.abs(result.outputs.effectiveDiscountPct - 10) < 1e-10);
});

test("zero price and a full discount are valid", () => {
  const zero = engine.calculate(fixture({ unitPrice: 0, discounts: [0], taxPct: 0 }));
  const free = engine.calculate(fixture({ discounts: [100], taxPct: 100 }));
  assert.equal(zero.valid, true);
  assert.equal(zero.outputs.finalTotal, 0);
  assert.equal(free.valid, true);
  assert.equal(free.outputs.finalTotal, 0);
  assert.equal(free.outputs.savings, 200);
});

test("blank optional tax is treated as zero", () => {
  const result = engine.calculate(fixture({ taxPct: "" }));
  assert.equal(result.valid, true);
  assert.equal(result.inputs.taxPct, 0);
  assert.equal(result.outputs.taxAmount, 0);
  assert.ok(Math.abs(result.outputs.finalTotal - 144) < 1e-10);
});

test("blank, negative, non-integer, excessive and non-finite inputs fail closed", () => {
  [
    fixture({ unitPrice: "" }),
    fixture({ unitPrice: -1 }),
    fixture({ quantity: 1.5 }),
    fixture({ quantity: 10001 }),
    fixture({ discounts: [] }),
    fixture({ discounts: [10, 10, 10, 10, 10, 10] }),
    fixture({ discounts: [101] }),
    fixture({ discounts: [Infinity] }),
    fixture({ taxPct: 101 }),
    fixture({ taxPct: NaN })
  ].forEach((input) => assert.equal(engine.calculate(input).valid, false));
});

test("extreme finite arithmetic fails closed", () => {
  const result = engine.calculate(fixture({ unitPrice: engine.LIMITS.price, quantity: engine.LIMITS.quantity }));
  assert.equal(result.valid, true);
  assert.ok(Number.isFinite(result.outputs.finalTotal));
  assert.equal(engine.calculate(fixture({ unitPrice: engine.LIMITS.price + 1 })).valid, false);
});

test("display label is bounded and never affects arithmetic", () => {
  const result = engine.calculate(fixture({ currencyLabel: "=CUSTOM-LABEL-THAT-IS-TOO-LONG" }));
  assert.equal(result.inputs.currencyLabel.length, 16);
  assert.ok(Math.abs(result.outputs.discountedSubtotal - 144) < 1e-10);
});
