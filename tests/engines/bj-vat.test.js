const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/bj-vat.js");

test("adds and extracts Benin's 18% standard VAT", () => {
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

test("keeps confirmed exports and planning scenarios distinct", () => {
  assert.deepEqual(engine.calculate({ amount: 1000, rateKind: "export" }), {
    mode: "add",
    rateKind: "export",
    rate: 0,
    net: 1000,
    vat: 0,
    gross: 1000,
  });
  assert.equal(
    engine.calculate({ amount: 1000, rateKind: "scenario", rate: 12.5 }).vat,
    125,
  );
});

test("rounds invoice lines before aggregation", () => {
  const result = engine.calculateInvoice([
    { quantity: 1, unitPrice: 0.015, rate: 18 },
    { quantity: 1, unitPrice: 0.015, rate: 18 },
  ]);
  assert.deepEqual(
    result.lines.map((line) => line.net),
    [0.02, 0.02],
  );
  assert.equal(result.net, 0.04);
  assert.equal(result.vat, 0);
  assert.equal(result.gross, 0.04);
});

test("does not promote unconfirmed exemption classifications", () => {
  assert.equal(engine.classify("standard").rate, 18);
  assert.match(engine.classify("confirmed-export").source, /zero-rate/i);
  assert.match(engine.classify("confirmed-exempt").source, /article 229/i);
  assert.equal(engine.classify("medical").treatment, "review");
});

test("records the statutory monthly filing deadline", () => {
  assert.match(engine.formulaParameters.filingDeadline, /10th/);
  assert.match(engine.formulaParameters.filingDeadline, /article 259/i);
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
