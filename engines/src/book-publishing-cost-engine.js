(function (global) {
  "use strict";

  var FX = Object.freeze({ NG: 1660, KE: 130, ZA: 18.5, GH: 15.5, EG: 48 });
  var SYMBOLS = Object.freeze({
    NG: "₦",
    KE: "KES ",
    ZA: "R",
    GH: "GHS ",
    EG: "EGP ",
  });

  function number(value, fallback) {
    return parseFloat(value) || fallback;
  }

  function integer(value, fallback) {
    return parseInt(value, 10) || fallback;
  }

  function routeDefaults(route, price) {
    if (route === "traditional") return { costShare: 0, royalty: 12 };
    if (route === "hybrid") return { costShare: 50, royalty: 50 };
    return { costShare: 100, royalty: price >= 2.99 && price <= 9.99 ? 70 : 35 };
  }

  function percentage(value, fallback) {
    if (value === null || value === undefined || String(value).trim() === "") return fallback;
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 100) {
      throw new RangeError("Percentages must be between 0 and 100.");
    }
    return parsed;
  }

  function calculate(input) {
    var country = input.country;
    var retailUSD = number(input.retailPrice, 12);
    var monthly = integer(input.monthlySales, 50);
    var devEdit = number(input.devEdit, 0);
    var copyEdit = number(input.copyEdit, 0);
    var proofread = number(input.proofread, 0);
    var coverDesign = number(input.coverDesign, 0);
    var layout = number(input.layout, 0);
    var isbn = number(input.isbn, 0);
    var printQty = integer(input.printQty, 0);
    var printCost = number(input.printCost, 0);
    var editingTotal = devEdit + copyEdit + proofread;
    var setupTotal = editingTotal + coverDesign + layout + isbn;
    var printTotal = printQty * printCost;
    var projectTotal = setupTotal + printTotal;
    var defaults = routeDefaults(input.pubRoute, retailUSD);
    var costShare = percentage(input.authorCostShare, defaults.costShare);
    var royalty = percentage(input.authorRoyalty, defaults.royalty);
    var totalUSD = projectTotal * (costShare / 100);
    var kdpRoyalty = retailUSD >= 2.99 && retailUSD <= 9.99 ? 0.7 : 0.35;
    var royaltyPerCopy = retailUSD * (royalty / 100);
    var platforms = [
      { name: "Amazon KDP (ebook)", royalty: kdpRoyalty },
      { name: "IngramSpark", royalty: 0.6 },
      { name: "Okadabooks", royalty: 0.7 },
      { name: "Bambooks", royalty: 0.7 },
      { name: "Traditional Publisher", royalty: 0.12 },
    ].map(function (platform) {
      var perCopy = retailUSD * platform.royalty;
      var monthlyRevenue = perCopy * monthly;
      return {
        name: platform.name,
        royalty: platform.royalty,
        perCopy: perCopy,
        monthly: monthlyRevenue,
        annual: monthlyRevenue * 12,
      };
    });
    var projections = [1, 2, 3].map(function (year) {
      var multiplier = [1, 1.3, 1.6][year - 1];
      var copies = Math.round(monthly * 12 * multiplier);
      var gross = copies * retailUSD;
      var publishingCost = year === 1 ? totalUSD : 0;
      return {
        year: year,
        copies: copies,
        gross: gross,
        publishingCost: publishingCost,
        net: copies * royaltyPerCopy - publishingCost,
      };
    });

    var result = {
      country: country,
      symbol: SYMBOLS[country],
      rate: FX[country],
      retailUSD: retailUSD,
      monthlySales: monthly,
      editingTotal: editingTotal,
      setupTotal: setupTotal,
      printQty: printQty,
      printTotal: printTotal,
      totalUSD: totalUSD,
      totalLocal: totalUSD * FX[country],
      royaltyPerCopy: royaltyPerCopy,
      breakEven:
        totalUSD === 0 ? 0 : royaltyPerCopy > 0 ? Math.ceil(totalUSD / royaltyPerCopy) : null,
      platforms: platforms,
      projections: projections,
    };
    if (input.pubRoute || input.authorCostShare != null || input.authorRoyalty != null) {
      result.projectTotal = projectTotal;
      result.authorCostShare = costShare;
      result.authorRoyalty = royalty;
    }
    return result;
  }

  global.AfroTools = global.AfroTools || {};
  global.AfroTools.BookPublishingCostEngine = Object.freeze({
    calculate: calculate,
    routeDefaults: routeDefaults,
  });
})(typeof window !== "undefined" ? window : globalThis);
