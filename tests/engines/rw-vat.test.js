const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/rw-vat.js");

test("adds and extracts the 18% standard rate", () => {
  assert.deepEqual(engine.calculate({ amount: 1000 }), {
    mode: "add",
    rateKind: "standard",
    rate: 18,
    net: 1000,
    vat: 180,
    gross: 1180,
  });
  assert.deepEqual(engine.calculate({ amount: 1180, mode: "extract" }), {
    mode: "extract",
    rateKind: "standard",
    rate: 18,
    net: 1000,
    vat: 180,
    gross: 1180,
  });
});

test("keeps confirmed zero and arbitrary scenarios distinct", () => {
  assert.equal(engine.calculate({ amount: 1000, rateKind: "zero" }).vat, 0);
  assert.equal(
    engine.calculate({ amount: 1000, rateKind: "scenario", rate: 12 }).vat,
    120,
  );
});

test("calculates invoice lines through the same engine", () => {
  const result = engine.calculateInvoice([{ quantity: 2, unitPrice: 500 }]);
  assert.equal(result.net, 1000);
  assert.equal(result.vat, 180);
  assert.equal(result.gross, 1180);
});

test("classifies only confirmed statutory treatments", () => {
  assert.match(engine.classify("standard").source, /Article 4/);
  assert.match(engine.classify("confirmed-zero").source, /Article 7/);
  assert.match(engine.classify("confirmed-exempt").source, /009\/2025/);
  assert.equal(engine.classify("food").treatment, "review");
});

test("registration thresholds are strictly exceeded", () => {
  assert.equal(
    engine.registrationBand({
      previousFiscalYear: 20000000,
      previousQuarter: 5000000,
    }).band,
    "below-threshold",
  );
  assert.deepEqual(
    engine.registrationBand({
      previousFiscalYear: 20000001,
      previousQuarter: 0,
    }).triggers,
    ["previous-fiscal-year"],
  );
  assert.deepEqual(
    engine.registrationBand({ previousFiscalYear: 0, previousQuarter: 5000001 })
      .triggers,
    ["previous-quarter"],
  );
});

test("rejects invalid inputs", () => {
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(
    () => engine.calculate({ amount: 1, rateKind: "scenario", rate: 101 }),
    RangeError,
  );
});
