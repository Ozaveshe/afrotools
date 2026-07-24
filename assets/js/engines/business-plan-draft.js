(function initBusinessPlanDraftEngine(root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.BusinessPlanDraft = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createEngine() {
  "use strict";
  var VERSION = "business-plan-draft-2026-07-23";
  var MAX_AMOUNT = 1000000000000;
  var MAX_SAFE_MONEY = Math.floor(Number.MAX_SAFE_INTEGER / 100);

  function cleanText(value, max) {
    return String(value == null ? "" : value).normalize("NFKC")
      .replace(/<[^>]*>/g, " ").replace(/[<>{}\u0000-\u001f\u007f]+/g, " ")
      .replace(/\s+/g, " ").trim().slice(0, max || 4000);
  }
  function number(value, min, max) {
    if (value === "" || value == null || typeof value === "boolean") return null;
    var n = Number(value);
    return Number.isFinite(n) && n >= min && n <= max ? n : null;
  }
  function money(value) {
    var n = Number(value);
    if (!Number.isFinite(n) || Math.abs(n) > MAX_SAFE_MONEY) return null;
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }
  function scenario(revenue, variableRatio, fixedCosts, multiplier) {
    var scenarioRevenue = money(revenue * multiplier);
    var variableCosts = money(scenarioRevenue * variableRatio);
    var contribution = money(scenarioRevenue - variableCosts);
    var operatingProfit = money(contribution - fixedCosts);
    if ([scenarioRevenue, variableCosts, contribution, operatingProfit].some(function (x) { return x == null; })) return null;
    return { revenue: scenarioRevenue, variableCosts: variableCosts, fixedCosts: fixedCosts, grossContribution: contribution, operatingProfit: operatingProfit };
  }
  function calculate(input) {
    var source = input && typeof input === "object" ? input : {};
    var currency = cleanText(source.currency, 12).toUpperCase();
    var revenue = number(source.monthlyRevenue, 0, MAX_AMOUNT);
    var variableCosts = number(source.monthlyVariableCosts, 0, MAX_AMOUNT);
    var fixedCosts = number(source.monthlyFixedCosts, 0, MAX_AMOUNT);
    var startupNeed = number(source.startupNeed, 0, MAX_AMOUNT);
    var workingCapitalNeed = number(source.workingCapitalNeed, 0, MAX_AMOUNT);
    var confirmedFunding = number(source.confirmedFunding, 0, MAX_AMOUNT);
    var scenarioChangePct = number(source.scenarioChangePct, 0, 100);
    var errors = [];
    if (!currency || !/^[\p{L}\p{N} .'-]{1,12}$/u.test(currency)) errors.push("currency");
    [["monthlyRevenue", revenue], ["monthlyVariableCosts", variableCosts], ["monthlyFixedCosts", fixedCosts],
      ["startupNeed", startupNeed], ["workingCapitalNeed", workingCapitalNeed],
      ["confirmedFunding", confirmedFunding], ["scenarioChangePct", scenarioChangePct]]
      .forEach(function (entry) { if (entry[1] == null) errors.push(entry[0]); });
    if (errors.length) return { valid: false, errors: errors };

    var contribution = money(revenue - variableCosts);
    var operatingProfit = money(contribution - fixedCosts);
    var contributionRatio = revenue > 0 ? contribution / revenue : null;
    var grossMarginPct = contributionRatio == null ? null : money(contributionRatio * 100);
    var operatingMarginPct = revenue > 0 ? money(operatingProfit / revenue * 100) : null;
    var totalProjectNeed = money(startupNeed + workingCapitalNeed);
    var fundingGap = money(Math.max(totalProjectNeed - confirmedFunding, 0));
    var fundingSurplus = money(Math.max(confirmedFunding - totalProjectNeed, 0));
    var breakEvenRevenue = contributionRatio != null && contributionRatio > 0 ? money(fixedCosts / contributionRatio) : null;
    var simplePaybackMonths = operatingProfit > 0 ? money(totalProjectNeed / operatingProfit) : null;
    var variableRatio = revenue > 0 ? variableCosts / revenue : 0;
    var delta = scenarioChangePct / 100;
    var low = scenario(revenue, variableRatio, fixedCosts, 1 - delta);
    var base = scenario(revenue, variableRatio, fixedCosts, 1);
    var high = scenario(revenue, variableRatio, fixedCosts, 1 + delta);
    var annual = {
      revenue: money(revenue * 12), variableCosts: money(variableCosts * 12),
      fixedCosts: money(fixedCosts * 12), operatingProfit: money(operatingProfit * 12)
    };
    if ([contribution, operatingProfit, totalProjectNeed, fundingGap, fundingSurplus]
      .concat(Object.values(annual)).some(function (x) { return x == null; }) ||
      !low || !base || !high || (contributionRatio > 0 && breakEvenRevenue == null)) {
      return { valid: false, errors: ["moneyOverflow"] };
    }
    return {
      valid: true, errors: [], version: VERSION,
      inputs: { currency: currency, monthlyRevenue: revenue, monthlyVariableCosts: variableCosts,
        monthlyFixedCosts: fixedCosts, startupNeed: startupNeed, workingCapitalNeed: workingCapitalNeed,
        confirmedFunding: confirmedFunding, scenarioChangePct: scenarioChangePct },
      outputs: { grossContribution: contribution, operatingProfit: operatingProfit,
        grossMarginPct: grossMarginPct, operatingMarginPct: operatingMarginPct,
        totalProjectNeed: totalProjectNeed, fundingGap: fundingGap, fundingSurplus: fundingSurplus,
        contributionRatioPct: contributionRatio == null ? null : money(contributionRatio * 100),
        breakEvenRevenue: breakEvenRevenue, simplePaybackMonths: simplePaybackMonths,
        annual: annual, scenarios: { low: low, base: base, high: high } },
      assumptions: { monthlyValuesRepeatedForAnnual: true, lowHighRevenueChangePct: scenarioChangePct,
        variableCostRatioHeldConstant: true, fixedCostsHeldConstant: true,
        paybackIsSimpleUndiscounted: true, currencyDisplayOnly: true, noTaxRatesOrFundingTermsSupplied: true }
    };
  }
  return { VERSION: VERSION, MAX_AMOUNT: MAX_AMOUNT, MAX_SAFE_MONEY: MAX_SAFE_MONEY, cleanText: cleanText, calculate: calculate };
});
