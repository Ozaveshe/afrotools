const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/ao-vat.js");

test("adds and extracts Angola's 14% general rate", () => {
  assert.deepEqual(engine.calculate({ amount: 100000 }), { mode: "add", rateKind: "standard", rate: 14, net: 100000, vat: 14000, gross: 114000 });
  assert.deepEqual(engine.calculate({ amount: 114000, mode: "extract" }), { mode: "extract", rateKind: "standard", rate: 14, net: 100000, vat: 14000, gross: 114000 });
});
test("keeps the conditional statutory rates distinct", () => {
  assert.equal(engine.calculate({ amount: 100000, rateKind: "simplified" }).vat, 7000);
  assert.equal(engine.calculate({ amount: 100000, rateKind: "hospitality" }).vat, 7000);
  assert.equal(engine.calculate({ amount: 100000, rateKind: "food" }).vat, 5000);
  assert.equal(engine.calculate({ amount: 100000, rateKind: "cabinda" }).vat, 1000);
});
test("rounds invoice lines before totals", () => {
  const result = engine.calculateInvoice([{ quantity: 1, unitPrice: 0.015 }, { quantity: 1, unitPrice: 0.015 }], { rateKind: "standard" });
  assert.deepEqual(result.lines.map((line) => line.net), [0.02, 0.02]);
  assert.equal(result.net, 0.04);
  assert.equal(result.vat, 0.01);
  assert.equal(result.gross, 0.05);
});
test("screens statutory regime thresholds and exceptions", () => {
  assert.equal(engine.regime(24999999, false, false).status, "excluded");
  assert.equal(engine.regime(25000000, false, false).status, "simplified");
  assert.equal(engine.regime(349999999, false, false).status, "simplified");
  assert.equal(engine.regime(350000000, false, false).status, "general");
  assert.equal(engine.regime(25000001, true, false).status, "general-manufacturing");
  assert.equal(engine.regime(1, false, true).status, "general-voluntary");
});
test("limits imposto cativo to named Article 21 classes", () => {
  assert.deepEqual(engine.captive(14000, "none"), { eligible: false, percent: 0, captive: 0, supplierReceives: 14000 });
  assert.deepEqual(engine.captive(14000, "article21-1"), { eligible: true, percent: 100, captive: 14000, supplierReceives: 0 });
  assert.deepEqual(engine.captive(14000, "article21-2"), { eligible: true, percent: 50, captive: 7000, supplierReceives: 7000 });
});
test("rejects missing and negative values", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.calculateInvoice([]), RangeError);
  assert.throws(() => engine.regime("", false, false), RangeError);
});
