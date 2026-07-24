(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.BreakEvenPlanner = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function requiredNumber(value, name) {
    if (value === "" || value === null || typeof value === "undefined") {
      throw new RangeError(name + " is required");
    }
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new RangeError(name + " must be a finite number");
    return parsed;
  }

  function optionalNumber(value, name) {
    if (value === "" || value === null || typeof value === "undefined") return null;
    return requiredNumber(value, name);
  }

  function nonNegative(value, name, optional) {
    var parsed = optional ? optionalNumber(value, name) : requiredNumber(value, name);
    if (parsed === null) return null;
    if (parsed < 0) throw new RangeError(name + " must be zero or greater");
    return parsed;
  }

  function round(value) {
    if (value === null) return null;
    return Math.round((value + Number.EPSILON) * 1000000) / 1000000;
  }

  function calculate(input) {
    input = input || {};
    var fixedCosts = nonNegative(input.fixedCosts, "fixed costs", false);
    var sellingPrice = requiredNumber(input.sellingPrice, "selling price");
    var variableCost = nonNegative(input.variableCost, "variable cost", false);
    var plannedUnits = nonNegative(input.plannedUnits, "planned units", true);
    var targetProfit = nonNegative(input.targetProfit, "target profit", true);

    if (sellingPrice <= 0) throw new RangeError("selling price must be greater than zero");
    if (sellingPrice <= variableCost) {
      throw new RangeError("selling price must be greater than variable cost");
    }

    var contributionPerUnit = sellingPrice - variableCost;
    var contributionRatio = contributionPerUnit / sellingPrice;
    var exactBreakEvenUnits = fixedCosts / contributionPerUnit;
    var wholeBreakEvenUnits = Math.ceil(exactBreakEvenUnits);
    var exactBreakEvenRevenue = fixedCosts / contributionRatio;
    var wholeUnitRevenue = wholeBreakEvenUnits * sellingPrice;
    var plannedRevenue = plannedUnits === null ? null : plannedUnits * sellingPrice;
    var plannedTotalCosts = plannedUnits === null ? null : fixedCosts + plannedUnits * variableCost;
    var plannedProfitLoss = plannedUnits === null ? null : plannedRevenue - plannedTotalCosts;
    var marginOfSafetyUnits = plannedUnits === null ? null : plannedUnits - exactBreakEvenUnits;
    var marginOfSafetyPercent = null;
    if (plannedUnits !== null) {
      marginOfSafetyPercent = plannedUnits === 0
        ? (exactBreakEvenUnits === 0 ? 0 : null)
        : marginOfSafetyUnits / plannedUnits * 100;
    }
    var targetProfitExactUnits = targetProfit === null
      ? null
      : (fixedCosts + targetProfit) / contributionPerUnit;
    var targetProfitWholeUnits = targetProfitExactUnits === null
      ? null
      : Math.ceil(targetProfitExactUnits);

    return Object.freeze({
      unit: String(input.unit || "").trim().slice(0, 12),
      fixedCosts: round(fixedCosts),
      sellingPrice: round(sellingPrice),
      variableCost: round(variableCost),
      plannedUnits: round(plannedUnits),
      targetProfit: round(targetProfit),
      contributionPerUnit: round(contributionPerUnit),
      contributionRatio: round(contributionRatio),
      exactBreakEvenUnits: round(exactBreakEvenUnits),
      wholeBreakEvenUnits: wholeBreakEvenUnits,
      exactBreakEvenRevenue: round(exactBreakEvenRevenue),
      wholeUnitRevenue: round(wholeUnitRevenue),
      plannedRevenue: round(plannedRevenue),
      plannedTotalCosts: round(plannedTotalCosts),
      plannedProfitLoss: round(plannedProfitLoss),
      marginOfSafetyUnits: round(marginOfSafetyUnits),
      marginOfSafetyPercent: round(marginOfSafetyPercent),
      targetProfitExactUnits: round(targetProfitExactUnits),
      targetProfitWholeUnits: targetProfitWholeUnits
    });
  }

  return Object.freeze({
    calculate: calculate,
    formulas: Object.freeze({
      contributionPerUnit: "selling price - variable cost per unit",
      contributionRatio: "contribution per unit / selling price",
      exactBreakEvenUnits: "fixed costs / contribution per unit",
      wholeBreakEvenUnits: "ceil(exact break-even units)",
      exactBreakEvenRevenue: "fixed costs / contribution ratio",
      wholeUnitRevenue: "whole break-even units x selling price",
      plannedProfitLoss: "planned units x selling price - fixed costs - planned units x variable cost",
      targetProfitUnits: "(fixed costs + target profit) / contribution per unit"
    })
  });
});
