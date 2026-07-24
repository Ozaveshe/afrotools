(function initMarketStallProfitEngine(root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.MarketStallProfit = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function createMarketStallProfitEngine() {
  "use strict";

  var VERSION = "market-stall-profit-2026-07-23";
  var LIMITS = {
    items: 20,
    expenses: 20,
    nameLength: 60,
    currencyLength: 12,
    amount: 1000000,
    units: 100000
  };
  var MAX_SAFE_MONEY = Math.floor(Number.MAX_SAFE_INTEGER / 100);

  function cleanText(value, maxLength) {
    return String(value == null ? "" : value)
      .normalize("NFKC")
      .replace(/<[^>]*>/g, " ")
      .replace(/[<>{}\u0000-\u001f\u007f]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength);
  }

  function finiteNumber(value) {
    if (value === "" || value == null || typeof value === "boolean") return null;
    var number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  function validNumber(value, min, max) {
    var number = finiteNumber(value);
    return number != null && number >= min && number <= max ? number : null;
  }

  function roundMoney(value) {
    if (!Number.isFinite(Number(value)) || Math.abs(Number(value)) > MAX_SAFE_MONEY) return null;
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function validate(input) {
    var source = input && typeof input === "object" ? input : {};
    var currency = cleanText(source.currency, LIMITS.currencyLength).toUpperCase();
    var marketDays = validNumber(source.marketDays, 1, 31);
    var reinvestRate = validNumber(source.reinvestRate, 0, 100);
    var rawItems = Array.isArray(source.items) ? source.items : [];
    var rawExpenses = Array.isArray(source.expenses) ? source.expenses : [];
    var errors = [];

    if (!currency || !/^[\p{L}\p{N} .'-]{1,12}$/u.test(currency)) errors.push("currency");
    if (marketDays == null || !Number.isInteger(marketDays)) errors.push("marketDays");
    if (reinvestRate == null) errors.push("reinvestRate");
    if (!rawItems.length || rawItems.length > LIMITS.items) errors.push("items");
    if (rawExpenses.length > LIMITS.expenses) errors.push("expenses");

    var items = rawItems.slice(0, LIMITS.items).map(function (item, index) {
      var value = item && typeof item === "object" ? item : {};
      var name = cleanText(value.name, LIMITS.nameLength);
      var unitCost = validNumber(value.unitCost, 0, LIMITS.amount);
      var unitPrice = validNumber(value.unitPrice, 0, LIMITS.amount);
      var unitsSold = validNumber(value.unitsSold, 0, LIMITS.units);
      var unitsLost = validNumber(value.unitsLost == null || value.unitsLost === "" ? 0 : value.unitsLost, 0, LIMITS.units);
      if (!name) errors.push("items." + index + ".name");
      if (unitCost == null) errors.push("items." + index + ".unitCost");
      if (unitPrice == null) errors.push("items." + index + ".unitPrice");
      if (unitsSold == null) errors.push("items." + index + ".unitsSold");
      if (unitsLost == null) errors.push("items." + index + ".unitsLost");
      return { name: name, unitCost: unitCost, unitPrice: unitPrice, unitsSold: unitsSold, unitsLost: unitsLost };
    });

    var expenses = rawExpenses.slice(0, LIMITS.expenses).map(function (expense, index) {
      var value = expense && typeof expense === "object" ? expense : {};
      var name = cleanText(value.name, LIMITS.nameLength);
      var amount = validNumber(value.amount, 0, LIMITS.amount);
      if (!name) errors.push("expenses." + index + ".name");
      if (amount == null) errors.push("expenses." + index + ".amount");
      return { name: name, amount: amount };
    });

    return {
      valid: errors.length === 0,
      errors: Array.from(new Set(errors)),
      values: {
        currency: currency,
        marketDays: marketDays,
        reinvestRate: reinvestRate,
        items: items,
        expenses: expenses
      }
    };
  }

  function calculate(input) {
    var checked = validate(input);
    if (!checked.valid) return checked;
    var values = checked.values;
    var revenue = 0;
    var soldStockCost = 0;
    var stockLossCost = 0;
    var operatingExpenses = 0;

    var items = values.items.map(function (item) {
      var itemRevenue = roundMoney(item.unitPrice * item.unitsSold);
      var itemSoldStockCost = roundMoney(item.unitCost * item.unitsSold);
      var itemStockLossCost = roundMoney(item.unitCost * item.unitsLost);
      var grossContribution = roundMoney(itemRevenue - itemSoldStockCost);
      var contributionAfterLoss = roundMoney(grossContribution - itemStockLossCost);
      revenue = roundMoney(revenue + itemRevenue);
      soldStockCost = roundMoney(soldStockCost + itemSoldStockCost);
      stockLossCost = roundMoney(stockLossCost + itemStockLossCost);
      return Object.assign({}, item, {
        revenue: itemRevenue,
        soldStockCost: itemSoldStockCost,
        stockLossCost: itemStockLossCost,
        grossContribution: grossContribution,
        contributionAfterLoss: contributionAfterLoss
      });
    });

    var expenses = values.expenses.map(function (expense) {
      operatingExpenses = roundMoney(operatingExpenses + expense.amount);
      return Object.assign({}, expense, { amount: roundMoney(expense.amount) });
    });

    var grossContribution = roundMoney(revenue - soldStockCost);
    var netDailyProfit = roundMoney(grossContribution - stockLossCost - operatingExpenses);
    var netMarginPct = revenue > 0 ? roundMoney(netDailyProfit / revenue * 100) : null;
    var contributionRatio = revenue > 0 ? grossContribution / revenue : null;
    var breakEvenRevenue = contributionRatio != null && contributionRatio > 0
      ? roundMoney((stockLossCost + operatingExpenses) / contributionRatio)
      : null;
    var positiveProfit = Math.max(0, netDailyProfit);
    var reinvestmentAllocation = roundMoney(positiveProfit * values.reinvestRate / 100);
    var unallocatedPositiveProfit = roundMoney(positiveProfit - reinvestmentAllocation);
    var days = values.marketDays;
    var monthlyValues = [
      roundMoney(revenue * days),
      roundMoney(soldStockCost * days),
      roundMoney(stockLossCost * days),
      roundMoney(operatingExpenses * days),
      roundMoney(netDailyProfit * days)
    ];
    if ((contributionRatio != null && contributionRatio > 0 && breakEvenRevenue == null) ||
      [revenue, soldStockCost, stockLossCost, operatingExpenses, grossContribution, netDailyProfit,
      reinvestmentAllocation, unallocatedPositiveProfit].concat(monthlyValues)
      .some(function (value) { return value == null; })) {
      return { valid: false, errors: ["moneyOverflow"], values: values };
    }

    return {
      valid: true,
      errors: [],
      version: VERSION,
      inputs: values,
      items: items,
      expenses: expenses,
      outputs: {
        revenue: revenue,
        soldStockCost: soldStockCost,
        stockLossCost: stockLossCost,
        grossContribution: grossContribution,
        operatingExpenses: operatingExpenses,
        netDailyProfit: netDailyProfit,
        netMarginPct: netMarginPct,
        contributionRatioPct: contributionRatio == null ? null : roundMoney(contributionRatio * 100),
        breakEvenRevenue: breakEvenRevenue,
        reinvestmentAllocation: reinvestmentAllocation,
        unallocatedPositiveProfit: unallocatedPositiveProfit,
        monthlyScenario: {
          days: days,
          revenue: monthlyValues[0],
          soldStockCost: monthlyValues[1],
          stockLossCost: monthlyValues[2],
          operatingExpenses: monthlyValues[3],
          netProfit: monthlyValues[4]
        }
      },
      assumptions: {
        currencyDisplayOnly: true,
        sameProductMixForBreakEven: true,
        repeatedDayForMonthlyScenario: true,
        noTaxOrFeeRatesSupplied: true
      }
    };
  }

  return {
    VERSION: VERSION,
    LIMITS: Object.assign({}, LIMITS),
    MAX_SAFE_MONEY: MAX_SAFE_MONEY,
    cleanText: cleanText,
    validate: validate,
    calculate: calculate,
    roundMoney: roundMoney
  };
});
