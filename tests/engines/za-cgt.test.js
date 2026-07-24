const assert = require("node:assert/strict");
const test = require("node:test");
const engine = require("../../assets/js/engines/za-cgt.js");

function base(overrides = {}) {
  return {
    taxpayerType: "individual",
    disposalDate: "2026-07-22",
    assetType: "general",
    proceeds: 2500000,
    acquisitionCost: 1500000,
    acquisitionCosts: 0,
    improvementCosts: 200000,
    disposalCosts: 50000,
    otherCapitalGains: 0,
    currentCapitalLosses: 0,
    assessedCapitalLoss: 0,
    otherTaxableIncome: 500000,
    residenceEligible: false,
    qualifyingResidencePercent: 100,
    ownershipPercent: 100,
    scopeConfirmed: true,
    ...overrides,
  };
}

test("individual uses annual exclusion, 40% inclusion and incremental 2027 bands", () => {
  const out = engine.calculate(base());
  assert.equal(out.transactionAmount, 750000);
  assert.equal(out.netCapitalGain, 700000);
  assert.equal(out.taxableCapitalGain, 280000);
  assert.equal(out.tax, 101816);
});

test("qualifying residence exclusion is limited and followed by annual exclusion", () => {
  const out = engine.calculate(
    base({
      assetType: "residence",
      residenceEligible: true,
      proceeds: 5000000,
      acquisitionCost: 1000000,
      improvementCosts: 0,
      disposalCosts: 0,
      otherTaxableIncome: 0,
    }),
  );
  assert.equal(out.residenceExclusion, 3000000);
  assert.equal(out.netCapitalGain, 950000);
  assert.equal(out.taxableCapitalGain, 380000);
  assert.equal(out.tax, 79192);
});

test("residence cap follows the taxpayer ownership share", () => {
  const out = engine.calculate(
    base({
      assetType: "residence",
      residenceEligible: true,
      proceeds: 5000000,
      acquisitionCost: 1000000,
      improvementCosts: 0,
      disposalCosts: 0,
      ownershipPercent: 50,
      otherTaxableIncome: 0,
    }),
  );
  assert.equal(out.residenceExclusion, 1500000);
  assert.equal(out.netCapitalGain, 2450000);
});

test("company uses 80% inclusion and 27% normal tax without annual exclusion", () => {
  const out = engine.calculate(
    base({
      taxpayerType: "company",
      proceeds: 2000000,
      acquisitionCost: 1000000,
      improvementCosts: 0,
      disposalCosts: 0,
    }),
  );
  assert.equal(out.taxableCapitalGain, 800000);
  assert.equal(out.tax, 216000);
});

test("ordinary trust uses 80% inclusion and 45% rate", () => {
  const out = engine.calculate(
    base({
      taxpayerType: "trust",
      proceeds: 2000000,
      acquisitionCost: 1000000,
      improvementCosts: 0,
      disposalCosts: 0,
    }),
  );
  assert.equal(out.taxableCapitalGain, 800000);
  assert.equal(out.tax, 360000);
});

test("annual exclusion reduces a current-year capital loss toward zero", () => {
  const out = engine.calculate(
    base({
      proceeds: 500000,
      acquisitionCost: 600000,
      improvementCosts: 0,
      disposalCosts: 0,
      otherTaxableIncome: 0,
    }),
  );
  assert.equal(out.aggregateBeforeAnnual, -100000);
  assert.equal(out.aggregateAfterAnnual, -50000);
  assert.equal(out.carriedCapitalLoss, 50000);
  assert.equal(out.tax, 0);
});

test("assessed loss is used before inclusion and unused balance carries forward", () => {
  const out = engine.calculate(base({ assessedCapitalLoss: 800000 }));
  assert.equal(out.netCapitalGain, 0);
  assert.equal(out.assessedLossUsed, 700000);
  assert.equal(out.carriedCapitalLoss, 100000);
});

test("scope and assessment-year boundaries are enforced", () => {
  assert.throws(
    () => engine.calculate(base({ scopeConfirmed: false })),
    /scope confirmation/,
  );
  assert.throws(
    () => engine.calculate(base({ disposalDate: "2026-02-28" })),
    /2027 assessment year/,
  );
  assert.doesNotThrow(() =>
    engine.calculate(base({ disposalDate: "2026-03-01" })),
  );
  assert.doesNotThrow(() =>
    engine.calculate(base({ disposalDate: "2027-02-28" })),
  );
});

test("invalid amounts and percentages fail closed", () => {
  assert.throws(() => engine.calculate(base({ proceeds: -1 })), /proceeds/);
  assert.throws(
    () =>
      engine.calculate(
        base({
          assetType: "residence",
          residenceEligible: true,
          qualifyingResidencePercent: 101,
        }),
      ),
    /must not exceed 100/,
  );
});
