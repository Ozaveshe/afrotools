const test = require("node:test");
const assert = require("node:assert/strict");
const engine = require("../../assets/js/engines/ke-cgt.js");

const base = {
  scopeConfirmed: true,
  exemptionClaimed: false,
  exemptionConfirmed: false,
  transferValue: 15000000,
  transferCosts: 200000,
  acquisitionCost: 8000000,
  acquisitionCosts: 300000,
  enhancementCosts: 1000000,
  preservationCosts: 0,
};

test("computes net transfer value, adjusted cost, gain and 15% tax separately", () => {
  const out = engine.calculate(base);
  assert.equal(out.netTransferValue, 14800000);
  assert.equal(out.adjustedCost, 9300000);
  assert.equal(out.rawGain, 5500000);
  assert.equal(out.tax, 825000);
  assert.equal(out.netProceedsAfterTax, 13975000);
});

test("floors a capital loss at zero tax", () => {
  const out = engine.calculate({ ...base, transferValue: 8000000 });
  assert.equal(out.rawGain, 0);
  assert.equal(out.tax, 0);
});

test("applies an exemption only after a separate confirmation", () => {
  assert.throws(
    () => engine.calculate({ ...base, exemptionClaimed: true }),
    /must be confirmed/,
  );
  const out = engine.calculate({
    ...base,
    exemptionClaimed: true,
    exemptionConfirmed: true,
  });
  assert.equal(out.rawGain, 5500000);
  assert.equal(out.taxableGain, 0);
  assert.equal(out.tax, 0);
  assert.equal(out.exempt, true);
});

test("preserves decimal precision and does not round the engine result", () => {
  const out = engine.calculate({
    ...base,
    transferValue: 100.55,
    transferCosts: 0.1,
    acquisitionCost: 0,
    acquisitionCosts: 0,
    enhancementCosts: 0,
    preservationCosts: 0,
  });
  assert.ok(Math.abs(out.tax - 15.0675) < 1e-10);
});

test("rejects missing scope and negative or non-finite inputs", () => {
  assert.throws(
    () => engine.calculate({ ...base, scopeConfirmed: false }),
    /scope confirmation/,
  );
  assert.throws(
    () => engine.calculate({ ...base, transferValue: -1 }),
    RangeError,
  );
  assert.throws(
    () => engine.calculate({ ...base, transferValue: Infinity }),
    RangeError,
  );
});

test("publishes reviewed formula and rounding metadata", () => {
  assert.equal(engine.RULES.rate, 0.15);
  assert.equal(engine.RULES.reviewedAt, "2026-07-22");
  assert.equal(
    engine.formulaParameters.taxableGain,
    "maximum of zero and net transfer value minus adjusted cost",
  );
  assert.equal(engine.roundingPolicy.mode, "none");
});
