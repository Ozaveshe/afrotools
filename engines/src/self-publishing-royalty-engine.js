(function (global) {
  "use strict";
  var FX = Object.freeze({ NG: 1660, KE: 130, ZA: 18.5, GH: 15.5 });
  var SYMBOLS = Object.freeze({ NG: "₦", KE: "KES ", ZA: "R", GH: "GHS " });
  function calculate(input) {
    var price = parseFloat(input.price) || 9.99;
    var format = input.format;
    var pages = parseInt(input.pages, 10) || 250;
    var monthly = parseInt(input.monthly, 10) || 80;
    var printCost = format === "paperback" ? 1 + pages * 0.012 : 0;
    var hardcoverPrint = format === "hardcover" ? 6 + pages * 0.012 : 0;
    var platforms;
    if (format === "ebook") {
      var rate = price >= 2.99 && price <= 9.99 ? 0.7 : 0.35;
      platforms = [
        { name: "Amazon KDP", rate: rate, perCopy: price * rate, note: rate === 0.7 ? "70% tier ($2.99–$9.99)" : "35% tier (outside range)" },
        { name: "IngramSpark", rate: 0.65, perCopy: price * 0.65, note: "60–70% standard" },
        { name: "Smashwords", rate: 0.6, perCopy: price * 0.6, note: "60% net" },
        { name: "Okadabooks", rate: 0.7, perCopy: price * 0.7, note: "70% — Nigeria focus" },
        { name: "Bambooks", rate: 0.7, perCopy: price * 0.7, note: "70% — Nigeria/Africa" },
      ];
    } else if (format === "paperback") {
      platforms = [
        { name: "Amazon KDP", rate: 0.6, perCopy: Math.max(0, (price - printCost) * 0.6), note: "print-cost-formula" },
        { name: "IngramSpark", rate: 0.55, perCopy: Math.max(0, (price - printCost) * 0.55), note: "~55% after print cost" },
        { name: "Local Print Run", rate: 0.7, perCopy: price * 0.7 - printCost, note: "Higher margin, limited reach" },
      ];
    } else {
      platforms = [
        { name: "Amazon KDP (Hardcover)", rate: 0.6, perCopy: Math.max(0, (price - hardcoverPrint) * 0.6), note: "60% after print cost" },
        { name: "IngramSpark", rate: 0.55, perCopy: Math.max(0, (price - hardcoverPrint) * 0.55), note: "55% after print cost" },
      ];
    }
    platforms.sort(function (a, b) { return b.perCopy - a.perCopy; });
    var sweetSpots = [0.99, 1.99, 2.99, 3.99, 4.99, 6.99, 9.99, 12.99, 14.99].map(function (candidate) {
      var royaltyRate = candidate >= 2.99 && candidate <= 9.99 ? 0.7 : 0.35;
      var monthlyRoyalty = candidate * royaltyRate * monthly;
      return { price: candidate, rate: royaltyRate, monthly: monthlyRoyalty, annual: monthlyRoyalty * 12 };
    });
    return {
      country: input.country, symbol: SYMBOLS[input.country], rate: FX[input.country],
      price: price, format: format, pages: pages, monthly: monthly, printCost: printCost,
      hardcoverPrint: hardcoverPrint, platforms: platforms, best: platforms[0], sweetSpots: sweetSpots,
    };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.SelfPublishingRoyaltyEngine = Object.freeze({ calculate: calculate });
})(typeof window !== "undefined" ? window : globalThis);
