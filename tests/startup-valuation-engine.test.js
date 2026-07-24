"use strict";
const assert = require("assert");
const engine = require("../engines/src/startup-valuation-engine.js");
const input = {
  currencyUnit: "TEST", uncertaintyPct: 20, annualRevenue: 100,
  multipleLow: 2, multipleBase: 3, multipleHigh: 4,
  comparableBaseline: 1000,
  weights: { team: 40, product: 20, traction: 20, market: 10, execution: 10 },
  relativeScores: { team: 120, product: 100, traction: 80, market: 100, execution: 100 },
  milestones: { productEvidence: 100, teamEvidence: 200, tractionEvidence: 300, relationshipsEvidence: 0, riskReductionEvidence: 0 }
};
const result = engine.calculate(input);
assert.deepStrictEqual(result.methods.map(x => x.id), ["revenue-multiple", "scorecard", "milestone-build-up"]);
assert.deepStrictEqual(result.methods[0], { id: "revenue-multiple", low: 200, point: 300, high: 400, formula: "annual revenue × user-entered low/base/high multiple" });
assert.strictEqual(result.methods[1].point, 1040);
assert.strictEqual(result.methods[2].point, 600);
assert.strictEqual(Object.values(result.methods[1].normalizedWeights).reduce((a, b) => a + b, 0), 1);
assert.deepStrictEqual(result.crossMethodSpan, { low: 200, high: 1248 });
assert.throws(() => engine.calculate({ ...input, currencyUnit: "" }), /CURRENCY_REQUIRED/);
assert.throws(() => engine.calculate({ ...input, uncertaintyPct: 101 }), /INVALID_NUMBER/);
assert.throws(() => engine.calculate({ ...input, multipleLow: 4 }), /MULTIPLE_ORDER/);
assert.throws(() => engine.calculate({ ...input, annualRevenue: 1e308 }), /INVALID_NUMBER/);
assert.throws(() => engine.calculate({ ...input, annualRevenue: -1 }), /INVALID_NUMBER/);
assert.throws(() => engine.calculate({ ...input, multipleBase: "" }), /MULTIPLE_ORDER/);
assert.throws(() => engine.calculate({ ...input, comparableBaseline: 1000, weights: {}, relativeScores: input.relativeScores }), /ZERO_WEIGHT_TOTAL/);
const zeroWeightBlankScore = engine.calculate({ ...input, weights: { ...input.weights, team: 0 }, relativeScores: { ...input.relativeScores, team: "" } });
assert.ok(Number.isFinite(zeroWeightBlankScore.methods[1].point), "a zero-weight criterion ignores its blank score");
assert.throws(() => engine.calculate({ ...input, relativeScores: { ...input.relativeScores, team: 201 } }), /INVALID_NUMBER/);
assert.throws(() => engine.calculate({ currencyUnit: "TEST", uncertaintyPct: 10 }), /METHOD_REQUIRED/);
console.log("startup-valuation-engine: ok");
