!function (window) {
  "use strict";

  var ETA_BANDS = [
    { width: 40000, rate: 0.00 },
    { width: 15000, rate: 0.10 },
    { width: 15000, rate: 0.15 },
    { width: 130000, rate: 0.20 },
    { width: 200000, rate: 0.225 },
    { width: 800000, rate: 0.25 },
    { width: Infinity, rate: 0.275 }
  ];

  var EXCLUSION_RULES = [
    { threshold: 600000, extraTax: 0, excludedBand: 0 },
    { threshold: 700000, extraTax: 1500, excludedBand: 1 },
    { threshold: 800000, extraTax: 2250, excludedBand: 2 },
    { threshold: 900000, extraTax: 26000, excludedBand: 3 },
    { threshold: 1000000, extraTax: 45000, excludedBand: 4 },
    { threshold: 1200000, extraTax: 274750, excludedBand: 5 }
  ];

  var NOSI_CAP = 174000;
  var NOSI_RATE = 0.11;
  var EMPLOYER_NOSI_RATE = 0.1875;
  var PERSONAL_EXEMPTION = 20000;
  var DISABLED_PERSONAL_EXEMPTION = 30000;

  function calcStandardTax(nati) {
    var remaining = Math.max(0, nati);
    var totalTax = 0;
    var bandBreakdown = [];

    for (var i = 0; i < ETA_BANDS.length; i++) {
      var band = ETA_BANDS[i];
      var income = Math.min(remaining, band.width === Infinity ? remaining : band.width);
      var taxInBand = income * band.rate;

      if (income > 0) {
        bandBreakdown.push({
          rate: band.rate * 100,
          income: income,
          tax: taxInBand
        });
      }

      totalTax += taxInBand;
      remaining -= income;

      if (remaining <= 0) break;
    }

    return { totalTax: totalTax, bandBreakdown: bandBreakdown };
  }

  function calcExclusion(nati) {
    var exclusionExtra = 0;
    var excludedBands = [];

    for (var i = 0; i < EXCLUSION_RULES.length; i++) {
      var rule = EXCLUSION_RULES[i];
      if (nati > rule.threshold) {
        exclusionExtra = rule.extraTax;
        excludedBands.push(rule.excludedBand);
      }
    }

    return {
      exclusionExtra: exclusionExtra,
      excludedBands: excludedBands
    };
  }

  function getMarginalRate(nati) {
    var remaining = Math.max(0, nati);

    for (var i = 0; i < ETA_BANDS.length; i++) {
      var band = ETA_BANDS[i];
      var width = band.width === Infinity ? remaining : band.width;
      if (remaining <= width) return band.rate * 100;
      remaining -= width;
    }

    return 27.5;
  }

  function calculate(grossAnnual, options) {
    options = options || {};

    var personalExemption = options.disabled ? DISABLED_PERSONAL_EXEMPTION : PERSONAL_EXEMPTION;
    var nosiBase = options.nosi === false ? 0 : Math.min(grossAnnual, NOSI_CAP);
    var nosi = nosiBase * NOSI_RATE;
    var nati = Math.max(0, grossAnnual - personalExemption - nosi);
    var standardTaxResult = calcStandardTax(nati);
    var exclusion = calcExclusion(nati);
    var tax = standardTaxResult.totalTax + exclusion.exclusionExtra;
    var employerNOSI = nosiBase * EMPLOYER_NOSI_RATE;
    var totalDeductions = nosi + tax;
    var netAnnual = grossAnnual - totalDeductions;

    return {
      gross: grossAnnual,
      personalExemption: personalExemption,
      nosi: nosi,
      nosiBase: nosiBase,
      nati: nati,
      standardTax: standardTaxResult.totalTax,
      exclusionExtra: exclusion.exclusionExtra,
      excludedBands: exclusion.excludedBands,
      tax: tax,
      totalDeductions: totalDeductions,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: grossAnnual > 0 ? tax / grossAnnual * 100 : 0,
      marginalRate: getMarginalRate(nati),
      bandBreakdown: standardTaxResult.bandBreakdown,
      employerNOSI: employerNOSI,
      totalEmployerCost: grossAnnual + employerNOSI
    };
  }

  var engine = {
    calculate: calculate,
    validate: function (grossAnnual) {
      if (!grossAnnual || isNaN(grossAnnual) || grossAnnual <= 0) {
        return { valid: false, error: "Please enter a valid salary amount" };
      }

      return { valid: true, error: null };
    },
    reverseCalc: function (targetNetAnnual, options) {
      var low = targetNetAnnual;
      var high = targetNetAnnual * 3;

      for (var i = 0; i < 50; i++) {
        var guess = (low + high) / 2;
        var result = calculate(guess, options);

        if (Math.abs(result.netAnnual - targetNetAnnual) < 1) {
          return guess;
        }

        if (result.netAnnual < targetNetAnnual) {
          low = guess;
        } else {
          high = guess;
        }
      }

      return (low + high) / 2;
    },
    ETA_BANDS: ETA_BANDS,
    EXCLUSION_RULES: EXCLUSION_RULES,
    PERSONAL_EXEMPTION: PERSONAL_EXEMPTION,
    DISABLED_PERSONAL_EXEMPTION: DISABLED_PERSONAL_EXEMPTION,
    NOSI_RATE: NOSI_RATE,
    NOSI_ANNUAL_CAP: NOSI_CAP,
    country: "Egypt",
    currency: "EGP",
    id: "eg-paye"
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.egPAYE = engine;
}(window);
