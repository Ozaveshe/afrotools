(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ProfitMarginEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function number(value, name, positive) {
    if (value === "" || value === null || typeof value === "undefined") throw new RangeError(name + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || (positive ? parsed <= 0 : parsed < 0)) {
      throw new RangeError(name + (positive ? " must be greater than zero" : " must be non-negative"));
    }
    return parsed;
  }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function percent(value, base) { return round(value / base * 100); }

  function calculate(input) {
    input = input || {};
    var mode = /^(gross|operating|net)$/.test(input.mode) ? input.mode : "gross";
    var revenue = number(input.revenue, "revenue", true);
    var cogs = number(input.cogs, "cost of goods sold", false);
    var operatingExpenses = mode === "gross" ? 0 : number(input.operatingExpenses, "operating expenses", false);
    var interestExpense = mode === "net" ? number(input.interestExpense, "interest expense", false) : 0;
    var taxExpense = mode === "net" ? number(input.taxExpense, "tax expense", false) : 0;
    var otherExpenses = mode === "net" ? number(input.otherExpenses, "other expenses", false) : 0;
    var grossProfit = revenue - cogs;
    var operatingProfit = grossProfit - operatingExpenses;
    var netProfit = operatingProfit - interestExpense - taxExpense - otherExpenses;
    var selectedProfit = mode === "gross" ? grossProfit : mode === "operating" ? operatingProfit : netProfit;
    return Object.freeze({
      mode: mode,
      unit: String(input.unit || "").trim().slice(0, 12),
      revenue: round(revenue),
      cogs: round(cogs),
      operatingExpenses: round(operatingExpenses),
      interestExpense: round(interestExpense),
      taxExpense: round(taxExpense),
      otherExpenses: round(otherExpenses),
      grossProfit: round(grossProfit),
      grossMargin: percent(grossProfit, revenue),
      markup: cogs === 0 ? null : percent(grossProfit, cogs),
      operatingProfit: round(operatingProfit),
      operatingMargin: percent(operatingProfit, revenue),
      netProfit: round(netProfit),
      netMargin: percent(netProfit, revenue),
      selectedProfit: round(selectedProfit),
      selectedMargin: percent(selectedProfit, revenue)
    });
  }

  return Object.freeze({
    calculate: calculate,
    formulas: Object.freeze({
      grossMargin: "(revenue - cost of goods sold) / revenue x 100",
      markup: "(revenue - cost of goods sold) / cost of goods sold x 100; undefined when cost is zero",
      operatingMargin: "(revenue - cost of goods sold - operating expenses) / revenue x 100",
      netMargin: "(revenue - all user-entered expenses) / revenue x 100"
    })
  });
});
