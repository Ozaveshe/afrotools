const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/sz-vat.js");

test("adds and extracts Eswatini's standard 15% VAT", () => {
  assert.deepEqual(engine.calculate({ amount: 10000 }), { mode: "add", rateKind: "standard", rate: 15, net: 10000, vat: 1500, gross: 11500, rounding: "nearest-cent", sourceAsOf: "2025-11-07" });
  assert.deepEqual(engine.calculate({ amount: 11500, mode: "extract" }), { mode: "extract", rateKind: "standard", rate: 15, net: 10000, vat: 1500, gross: 11500, rounding: "nearest-cent", sourceAsOf: "2025-11-07" });
});

test("zero-rating fails closed without an exact current Second Schedule match", () => {
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: "second-schedule-zero-confirmed" }), (error) => error.code === "RATE_EVIDENCE_REQUIRED");
  assert.throws(() => engine.calculate({ amount: 10000, rateKind: "second-schedule-zero-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: "generic-export" }), (error) => error.code === "RATE_EVIDENCE_REQUIRED");
  assert.equal(engine.calculate({ amount: 10000, rateKind: "second-schedule-zero-confirmed", rateEvidenceConfirmed: true, rateEvidenceType: engine.ZERO_EVIDENCE }).vat, 0);
});

test("rejects custom treatments and invalid inputs", () => {
  assert.throws(() => engine.calculate({ amount: "" }), RangeError);
  assert.throws(() => engine.calculate({ amount: -1 }), RangeError);
  assert.throws(() => engine.calculate({ amount: 100, rateKind: "custom" }), RangeError);
  assert.equal(engine.STANDARD_RATE, 15);
  assert.equal(engine.REVIEWED_ON, "2026-07-22");
});

test("rounds to cents while preserving the gross identity", () => {
  const result = engine.calculate({ amount: 99.99 });
  assert.equal(result.net, 99.99);
  assert.equal(result.vat, 15);
  assert.equal(result.gross, 114.99);
  assert.equal(result.net + result.vat, result.gross);
});
