(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.StartupValuationEngine = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";
  var CRITERIA = ["team", "product", "traction", "market", "execution"];
  var MILESTONES = ["productEvidence", "teamEvidence", "tractionEvidence", "relationshipsEvidence", "riskReductionEvidence"];

  function fail(code, fields) { var error = new Error(code); error.fields = fields || []; throw error; }

  function number(value, minimum, maximum, blankAllowed, field) {
    if (value === "" || value === null || typeof value === "undefined") {
      if (blankAllowed) return 0;
      fail("VALUE_REQUIRED", [field]);
    }
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < minimum || parsed > maximum) fail("INVALID_NUMBER", [field]);
    return parsed;
  }
  function band(point, uncertainty) {
    return { low: point * (1 - uncertainty / 100), point: point, high: point * (1 + uncertainty / 100) };
  }
  function calculate(input) {
    if (!input || typeof input !== "object") throw new Error("INPUT_REQUIRED");
    var unit = String(input.currencyUnit || "").trim();
    if (!unit || unit.length > 8 || /[\r\n<>]/.test(unit)) fail("CURRENCY_REQUIRED", ["currencyUnit"]);
    var uncertainty = number(input.uncertaintyPct, 0, 100, false, "uncertaintyPct");
    var methods = [];

    var revenue = number(input.annualRevenue, 0, 1e15, true, "annualRevenue");
    var lowMultiple = number(input.multipleLow, 0, 1000, true, "multipleLow");
    var baseMultiple = number(input.multipleBase, 0, 1000, true, "multipleBase");
    var highMultiple = number(input.multipleHigh, 0, 1000, true, "multipleHigh");
    if (revenue || lowMultiple || baseMultiple || highMultiple) {
      if (!(revenue > 0 && lowMultiple > 0 && lowMultiple <= baseMultiple && baseMultiple <= highMultiple)) fail("MULTIPLE_ORDER", revenue > 0 ? ["multipleLow", "multipleBase", "multipleHigh"] : ["annualRevenue"]);
      methods.push({ id: "revenue-multiple", low: revenue * lowMultiple, point: revenue * baseMultiple, high: revenue * highMultiple, formula: "annual revenue × user-entered low/base/high multiple" });
    }

    var baseline = number(input.comparableBaseline, 0, 1e15, true, "comparableBaseline");
    if (baseline > 0) {
      var totalWeight = 0, weighted = 0, normalizedWeights = {};
      CRITERIA.forEach(function (key) {
        var weight = number(input.weights && input.weights[key], 0, 1e6, true, "weights." + key);
        var score = number(input.relativeScores && input.relativeScores[key], 0, 200, weight === 0, "relativeScores." + key);
        totalWeight += weight;
        weighted += weight * score;
        normalizedWeights[key] = weight;
      });
      if (totalWeight <= 0) fail("ZERO_WEIGHT_TOTAL", CRITERIA.map(function (key) { return "weights." + key; }));
      CRITERIA.forEach(function (key) { normalizedWeights[key] /= totalWeight; });
      var factor = weighted / totalWeight / 100;
      methods.push(Object.assign({ id: "scorecard", factor: factor, normalizedWeights: normalizedWeights, formula: "user-entered comparable baseline × normalized weighted relative score" }, band(baseline * factor, uncertainty)));
    }

    var milestoneTotal = MILESTONES.reduce(function (sum, key) {
      return sum + number(input.milestones && input.milestones[key], 0, 1e15, true, "milestones." + key);
    }, 0);
    if (milestoneTotal > 0) {
      methods.push(Object.assign({ id: "milestone-build-up", formula: "sum of user-entered evidence values for five milestones" }, band(milestoneTotal, uncertainty)));
    }
    if (!methods.length) fail("METHOD_REQUIRED", ["annualRevenue", "comparableBaseline", "milestones.productEvidence"]);
    methods.forEach(function (method) {
      ["low", "point", "high"].forEach(function (key) {
        if (!Number.isFinite(method[key]) || method[key] < 0) throw new Error("INVALID_RESULT");
      });
    });
    return {
      currencyUnit: unit,
      uncertaintyPct: uncertainty,
      methods: methods,
      crossMethodSpan: {
        low: Math.min.apply(Math, methods.map(function (method) { return method.low; })),
        high: Math.max.apply(Math, methods.map(function (method) { return method.high; }))
      },
      methodology: "Each method is independent. Revenue multiple uses only the entered annual revenue and multiples. Scorecard uses only the entered comparable baseline, relative scores, and normalized weights. Milestone build-up sums entered evidence values. User-entered uncertainty creates symmetric bands around scorecard and milestone point estimates. The cross-method span is not an average, price, recommendation, or investment advice."
    };
  }
  return { CRITERIA: CRITERIA, MILESTONES: MILESTONES, calculate: calculate };
});
