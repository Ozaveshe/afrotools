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
    var totalUSD = setupTotal + printTotal;
    var kdpRoyalty = retailUSD >= 2.99 && retailUSD <= 9.99 ? 0.7 : 0.35;
    var royaltyPerCopy = retailUSD * kdpRoyalty;
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

    return {
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
        royaltyPerCopy > 0 ? Math.ceil(totalUSD / royaltyPerCopy) : 9999,
      platforms: platforms,
      projections: projections,
    };
  }

  global.AfroTools = global.AfroTools || {};
  global.AfroTools.BookPublishingCostEngine = Object.freeze({
    calculate: calculate,
  });
})(typeof window !== "undefined" ? window : globalThis);
