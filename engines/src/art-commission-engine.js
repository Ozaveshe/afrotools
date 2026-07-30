(function (global) {
  "use strict";

  var BASE_PRICES = Object.freeze({
    NG: Object.freeze({ digital_portrait: [15000, 50000], digital_illustration: [20000, 100000], oil_portrait: [40000, 500000], oil_landscape: [30000, 300000], acrylic: [25000, 200000], watercolour: [15000, 80000], pencil: [10000, 50000], abstract: [20000, 200000], logo: [20000, 80000] }),
    KE: Object.freeze({ digital_portrait: [1500, 6000], digital_illustration: [2000, 12000], oil_portrait: [4000, 60000], oil_landscape: [3000, 35000], acrylic: [2500, 25000], watercolour: [1500, 10000], pencil: [1000, 6000], abstract: [2000, 25000], logo: [2000, 10000] }),
    ZA: Object.freeze({ digital_portrait: [500, 2000], digital_illustration: [600, 3500], oil_portrait: [1200, 18000], oil_landscape: [1000, 12000], acrylic: [800, 8000], watercolour: [500, 3500], pencil: [350, 1800], abstract: [700, 8000], logo: [600, 3000] }),
    GH: Object.freeze({ digital_portrait: [200, 800], digital_illustration: [250, 1200], oil_portrait: [500, 6000], oil_landscape: [400, 4000], acrylic: [350, 3000], watercolour: [200, 1200], pencil: [150, 600], abstract: [300, 3000], logo: [300, 1200] }),
    EG: Object.freeze({ digital_portrait: [700, 2500], digital_illustration: [900, 4500], oil_portrait: [2000, 20000], oil_landscape: [1500, 15000], acrylic: [1200, 10000], watercolour: [700, 4000], pencil: [500, 2000], abstract: [1000, 10000], logo: [1000, 4000] }),
  });

  var SYMBOLS = Object.freeze({
    NG: "₦",
    KE: "KES ",
    ZA: "R",
    GH: "GHS ",
    EG: "EGP ",
  });

  var SIZE_MULTIPLIERS = Object.freeze({
    A4: 0.7,
    A3: 1,
    A2: 1.4,
    custom: 1.8,
  });

  var COMPLEXITY_MULTIPLIERS = Object.freeze({
    simple: 0.7,
    detailed: 1,
    very_detailed: 1.5,
  });

  function calculate(input) {
    var country = input.country;
    var artType = input.artType;
    var size = input.size;
    var complexity = input.complexity;
    var rights = input.rights;
    var revisions = input.revisions;
    var timeline = input.timeline;
    var hours = parseFloat(input.hours) || 8;
    var baseRange =
      BASE_PRICES[country] && BASE_PRICES[country][artType]
        ? BASE_PRICES[country][artType]
        : [10000, 50000];
    var sizeMultiplier = SIZE_MULTIPLIERS[size];
    var complexityMultiplier = COMPLEXITY_MULTIPLIERS[complexity];
    var base = baseRange[0] + (baseRange[1] - baseRange[0]) * 0.4;
    var price = base * sizeMultiplier * complexityMultiplier;

    if (rights === "commercial") price *= 1.5;
    if (revisions === "unlimited") price *= 1.2;
    if (timeline === "rush") price *= 1.3;

    return {
      country: country,
      artType: artType,
      size: size,
      complexity: complexity,
      rights: rights,
      revisions: revisions,
      timeline: timeline,
      hours: hours,
      symbol: SYMBOLS[country],
      base: base,
      price: price,
      minPrice: baseRange[0] * sizeMultiplier * complexityMultiplier,
      maxPrice: baseRange[1] * sizeMultiplier * complexityMultiplier,
      hourlyRate: price / hours,
      sizeMultiplier: sizeMultiplier,
      complexityMultiplier: complexityMultiplier,
    };
  }

  global.AfroTools = global.AfroTools || {};
  global.AfroTools.ArtCommissionEngine = Object.freeze({
    calculate: calculate,
  });
})(typeof window !== "undefined" ? window : globalThis);
