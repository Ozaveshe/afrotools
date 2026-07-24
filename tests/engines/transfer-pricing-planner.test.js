const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../../assets/js/engines/transfer-pricing-planner.js");

const base = {
  jurisdiction: "Example jurisdiction",
  period: "FY2025",
  method: "tnmm",
  amountA: 1000000,
  amountB: 950000,
  rangeLow: 3,
  rangeMedian: 5,
  rangeHigh: 8,
  comparableSource: "Internal search, FY2025, screened on 2026-07-20",
  scopeConfirmed: true,
};

test("TNMM computes operating margin and identifies an inside user range", () => {
  const result = engine.analyze(base);
  assert.equal(result.ok, true);
  assert.equal(result.indicator, 5);
  assert.equal(result.status, "inside");
});

test("cost plus computes markup on cost base", () => {
  const result = engine.analyze({ ...base, method: "costPlus", amountA: 115, amountB: 100, rangeLow: 10, rangeMedian: 15, rangeHigh: 20 });
  assert.equal(result.indicator, 15);
  assert.equal(result.status, "inside");
});

test("resale computes gross margin on resale revenue", () => {
  const result = engine.analyze({ ...base, method: "resale", amountA: 200, amountB: 150, rangeLow: 20, rangeMedian: 25, rangeHigh: 30 });
  assert.equal(result.indicator, 25);
});

test("CUP compares the controlled unit price directly with a user price range", () => {
  const result = engine.analyze({ ...base, method: "cup", amountA: 104, amountB: 0, rangeLow: 95, rangeMedian: 100, rangeHigh: 103 });
  assert.equal(result.indicator, 104);
  assert.equal(result.status, "above");
});

test("loan compares the entered annual rate with a user-supplied rate range", () => {
  const result = engine.analyze({ ...base, method: "loan", amountA: 1000000, amountB: 8, rangeLow: 5, rangeMedian: 6, rangeHigh: 7 });
  assert.equal(result.status, "above");
  assert.equal(result.differenceToMedian, 2);
});

test("below and above are descriptive range positions, not compliance verdicts", () => {
  assert.equal(engine.analyze({ ...base, amountB: 990000 }).status, "below");
  assert.equal(engine.analyze({ ...base, amountB: 800000 }).status, "above");
});

test("range must be ordered", () => {
  assert.equal(engine.analyze({ ...base, rangeLow: 8, rangeMedian: 5, rangeHigh: 3 }).ok, false);
});

test("comparable source and user-range confirmation are mandatory", () => {
  assert.equal(engine.analyze({ ...base, comparableSource: "" }).ok, false);
  assert.equal(engine.analyze({ ...base, scopeConfirmed: false }).ok, false);
});

test("jurisdiction and period context are mandatory", () => {
  assert.equal(engine.analyze({ ...base, jurisdiction: "" }).ok, false);
  assert.equal(engine.analyze({ ...base, period: "" }).ok, false);
});

test("invalid amounts fail closed", () => {
  assert.equal(engine.analyze({ ...base, amountA: 0 }).ok, false);
  assert.equal(engine.analyze({ ...base, method: "costPlus", amountB: 0 }).ok, false);
});
