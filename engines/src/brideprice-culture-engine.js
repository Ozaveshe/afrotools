(function (root, factory) {
  "use strict";
  if (typeof module === "object" && module.exports) module.exports = factory();
  else root.BridePriceCultureEngine = factory();
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function finite(value) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function calculate(input) {
    var culture = input && input.culture;
    var saved = finite(input && input.saved);
    var months = finite(input && input.months);
    var homes = finite(input && input.homes);
    var tone = input && input.tone || "balanced";
    if (!culture || !Number.isFinite(culture.totalAvg) || culture.totalAvg < 0 ||
        !Number.isFinite(saved) || saved < 0 || !Number.isFinite(months) || months < 1 ||
        !Number.isFinite(homes) || homes < 1 || !["symbolic", "balanced", "full"].includes(tone)) {
      return { status: "invalid", values: {} };
    }
    var factor = tone === "symbolic" ? 0.65 : tone === "full" ? 1.2 : 1;
    var target = Math.round(culture.totalAvg * factor);
    var gap = Math.max(0, target - saved);
    return {
      status: "ok",
      values: {
        factor: factor,
        target: target,
        gap: gap,
        monthly: Math.ceil(gap / months),
        perHome: Math.ceil(gap / homes)
      }
    };
  }

  function context(culture, annualIncome) {
    var income = finite(annualIncome);
    if (!culture || !Number.isFinite(culture.totalAvg) || culture.totalAvg < 0 ||
        !Number.isFinite(income) || income <= 0) {
      return { status: "invalid", values: {} };
    }
    var monthsOfIncome = culture.totalAvg / (income / 12);
    return {
      status: "ok",
      values: {
        monthsOfIncome: monthsOfIncome,
        percentOfAnnualIncome: Math.round(culture.totalAvg / income * 100),
        savingsMonthsAt15Pct: Math.max(1, Math.ceil(culture.totalAvg / (income * 0.15 / 12)))
      }
    };
  }

  return { calculate: calculate, context: context };
});
