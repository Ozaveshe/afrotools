(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.MarkupSellingPriceEngine = api;
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

  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    input = input || {};
    var mode = input.mode === "target-margin" ? "target-margin" : "markup";
    var cost = requiredNumber(input.cost, "cost");
    var percentage = requiredNumber(input.percentage, mode === "markup" ? "markup" : "target margin");
    if (cost <= 0) throw new RangeError("cost must be greater than zero");
    if (mode === "markup" && percentage <= -100) throw new RangeError("markup must be greater than -100%");
    if (mode === "target-margin" && percentage >= 100) throw new RangeError("target margin must be less than 100%");

    var sellingPrice = mode === "markup"
      ? cost * (1 + percentage / 100)
      : cost / (1 - percentage / 100);
    var profit = sellingPrice - cost;
    var markup = profit / cost * 100;
    var margin = profit / sellingPrice * 100;

    return Object.freeze({
      mode: mode,
      unit: String(input.unit || "").trim().slice(0, 12),
      cost: round(cost),
      inputPercentage: round(percentage),
      sellingPrice: round(sellingPrice),
      profit: round(profit),
      markup: round(markup),
      margin: round(margin)
    });
  }

  function compare(input) {
    input = input || {};
    if (!Array.isArray(input.markups) || input.markups.length === 0) {
      throw new RangeError("at least one markup is required");
    }
    if (input.markups.length > 20) throw new RangeError("no more than 20 markups are allowed");
    return input.markups.map(function (markup) {
      return calculate({ mode: "markup", cost: input.cost, percentage: markup, unit: input.unit });
    });
  }

  return Object.freeze({
    calculate: calculate,
    compare: compare,
    formulas: Object.freeze({
      markupToPrice: "selling price = cost x (1 + markup / 100)",
      targetMarginToPrice: "selling price = cost / (1 - target margin / 100)",
      profit: "profit = selling price - cost",
      margin: "margin = profit / selling price x 100",
      markup: "markup = profit / cost x 100"
    })
  });
});
