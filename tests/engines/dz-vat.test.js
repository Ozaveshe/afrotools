const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/dz-vat.js");

test("adds and extracts the 19% normal rate", () => {
  assert.deepEqual(engine.calculate({ amount: 1000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 19,
    net: 1000,
    vat: 190,
    gross: 1190,
  });
  assert.deepEqual(engine.calculate({ amount: 1190, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 19,
    net: 1000,
    vat: 190,
    gross: 1190,
  });
});
test("keeps confirmed 9% and planning scenarios distinct", () => {
  assert.equal(engine.calculate({ amount: 1000, rateKind: "reduced" }).vat, 90);
  assert.deepEqual(
    engine.calculate({ amount: 1000, rateKind: "scenario", rate: 7 }),
    {
      mode: "add",
      rateKind: "scenario",
      rate: 7,
      net: 1000,
      vat: 70,
      gross: 1070,
    },
  );
});
test("rounds each invoice line before the shared calculation", () => {
  const result = engine.calculateInvoice([
    { quantity: 1, unitPrice: 0.015 },
    { quantity: 1, unitPrice: 0.015 },
  ]);
  assert.deepEqual(
    result.lines.map((line) => line.net),
    [0.02, 0.02],
  );
  assert.equal(result.net, 0.04);
  assert.equal(result.vat, 0.01);
  assert.equal(result.gross, 0.05);
});
test("classifies only confirmed TCA treatments", () => {
  assert.equal(engine.classify("standard").rate, 19);
  assert.match(engine.classify("confirmed-reduced").source, /article 23/i);
  assert.match(engine.classify("confirmed-exempt").source, /articles 8 to 13/i);
  assert.equal(engine.classify("food").treatment, "review");
});
test("describes regimes without inventing a registration threshold", () => {
  assert.equal(engine.regime("real").vatRelevant, true);
  assert.equal(engine.regime("simplified").vatRelevant, true);
  assert.equal(engine.regime("ifu").vatRelevant, false);
  assert.equal(engine.regime("unknown").vatRelevant, null);
});
test("rejects empty, negative, and excessive inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(
    () => engine.calculate({ amount: 1, rateKind: "scenario", rate: 101 }),
    RangeError,
  );
  assert.throws(() => engine.calculateInvoice([]), RangeError);
  assert.throws(
    () => engine.calculateInvoice([{ quantity: "", unitPrice: 1 }]),
    RangeError,
  );
});
