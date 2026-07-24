(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.NigeriaCit = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var RULES = {
    effectiveFrom: "2026-01-01",
    smallTurnoverMax: 50000000,
    smallFixedAssetsMax: 250000000,
    citRate: 0.3,
    developmentLevyRate: 0.04,
    etrTurnoverReview: 20000000000,
  };
  function money(value, name) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0)
      throw new Error((name || "Amount") + " must be zero or greater.");
    return number;
  }
  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }
  function calculate(input) {
    input = input || {};
    if (input.scopeConfirmed !== true)
      throw new Error(
        "Confirm that the company is within the calculator scope.",
      );
    var turnover = money(input.turnover, "Turnover"),
      fixedAssets = money(input.fixedAssets, "Fixed assets"),
      totalProfits = money(input.totalProfits, "Total profits"),
      assessableProfits = money(input.assessableProfits, "Assessable profits"),
      professionalServices = input.professionalServices === true,
      mneGroup = input.mneGroup === true;
    var small =
      turnover <= RULES.smallTurnoverMax &&
      fixedAssets <= RULES.smallFixedAssetsMax &&
      !professionalServices;
    var citRate = small ? 0 : RULES.citRate,
      levyRate = small ? 0 : RULES.developmentLevyRate,
      cit = round(totalProfits * citRate),
      developmentLevy = round(assessableProfits * levyRate),
      total = round(cit + developmentLevy);
    return {
      regime: "Nigeria Tax Act 2025 (from 1 January 2026)",
      classification: small ? "small" : "other",
      smallCompany: small,
      professionalServices: professionalServices,
      turnover: round(turnover),
      fixedAssets: round(fixedAssets),
      totalProfits: round(totalProfits),
      assessableProfits: round(assessableProfits),
      citRate: citRate,
      developmentLevyRate: levyRate,
      cit: cit,
      developmentLevy: developmentLevy,
      total: total,
      etrReview: mneGroup || turnover >= RULES.etrTurnoverReview,
      limitations: [
        "Resident ordinary company estimate only",
        "Excludes minimum effective tax top-up",
        "Excludes specialised sectors, incentives, losses and transition adjustments",
      ],
    };
  }
  return {
    RULES: RULES,
    formulaParameters: {
      effectiveFrom: RULES.effectiveFrom,
      smallTurnoverMaximum: RULES.smallTurnoverMax,
      smallFixedAssetsMaximum: RULES.smallFixedAssetsMax,
      citRate: RULES.citRate,
      developmentLevyRate: RULES.developmentLevyRate,
      etrTurnoverReview: RULES.etrTurnoverReview,
      professionalServicesExcluded: true,
    },
    roundingPolicy: {
      method: "nearest-cent",
      precision: 2,
      stages: [
        "Round CIT and development levy independently",
        "Round the combined total after aggregation",
      ],
    },
    calculate: calculate,
  };
});
