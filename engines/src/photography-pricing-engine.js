(function (global) {
  "use strict";
  var FX = Object.freeze({ NG: 1660, KE: 130, ZA: 18.5, GH: 15.5, EG: 48, TZ: 2600 });
  var SYMBOLS = Object.freeze({ NG: "₦", KE: "KES ", ZA: "R", GH: "GHS ", EG: "EGP ", TZ: "TZS " });
  var MARKET = Object.freeze({
    NG: { new: [15000, 40000], mid: [50000, 150000], senior: [150000, 500000], established: [500000, 2000000] },
    KE: { new: [2000, 5000], mid: [6000, 18000], senior: [20000, 60000], established: [60000, 200000] },
    ZA: { new: [500, 1500], mid: [1500, 5000], senior: [5000, 15000], established: [15000, 60000] },
    GH: { new: [300, 800], mid: [900, 2500], senior: [2500, 8000], established: [8000, 25000] },
    EG: { new: [1000, 3000], mid: [3000, 9000], senior: [9000, 25000], established: [25000, 80000] },
    TZ: { new: [50000, 100000], mid: [150000, 400000], senior: [400000, 1200000], established: [1200000, 4000000] },
  });
  function calculate(input) {
    var country = input.country;
    var market = MARKET[country] || MARKET.NG;
    var range = market[input.experience];
    var shootHours = parseFloat(input.shootHours) || 4;
    var editHours = parseFloat(input.editHours) || 3;
    var studioRent = parseFloat(input.studioRent) || 0;
    var workDays = parseInt(input.workDays, 10) || 20;
    var equipmentValue = parseFloat(input.equipmentValue) || 500000;
    var basePrice = (range[0] + range[1]) / 2;
    var specialityMultiplier = { portrait: 1, wedding: 2.5, commercial: 1.8, realestate: 1.2, product: 1.4, events: 1.3, fashion: 1.6 }[input.speciality] || 1;
    var equipmentMultiplier = { entry: 0.8, mid: 1, pro: 1.3 }[input.equipment] || 1;
    var printMultiplier = { no: 1, basic: 1.1, album: 1.25 }[input.prints] || 1;
    var dailyCost = studioRent / workDays + equipmentValue * 0.2 / workDays / 12;
    var sessionPrice = Math.max(basePrice * specialityMultiplier * equipmentMultiplier * printMultiplier, dailyCost * 2);
    var monthly = workDays / 5 * sessionPrice;
    return {
      country: country, symbol: SYMBOLS[country], rate: FX[country], market: market,
      experience: input.experience, shootHours: shootHours, editHours: editHours,
      dailyCost: dailyCost, sessionPrice: sessionPrice,
      dayRate: sessionPrice * (8 / shootHours), monthly: monthly, annual: monthly * 12,
      hourlyRate: sessionPrice / (shootHours + editHours),
    };
  }
  global.AfroTools = global.AfroTools || {};
  global.AfroTools.PhotographyPricingEngine = Object.freeze({ calculate: calculate });
})(typeof window !== "undefined" ? window : globalThis);
