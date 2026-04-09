!function (window) {
  "use strict";

  var GH_BANDS = [
    { width: 5880, rate: 0.00 },
    { width: 1320, rate: 0.05 },
    { width: 1560, rate: 0.10 },
    { width: 38000, rate: 0.175 },
    { width: 192000, rate: 0.25 },
    { width: 366240, rate: 0.30 },
    { width: Infinity, rate: 0.35 }
  ];

  var SSNIT_CAP = 61000;
  var SSNIT_EMP_RATE = 0.055;
  var SSNIT_EMPLOYER_RATE = 0.13;
  var TIER3_CAP_RATE = 0.165;
  var MARRIAGE_RELIEF = 1200;
  var CHILD_RELIEF = 1200;
  var MAX_CHILDREN = 2;
  var OLD_AGE_RELIEF = 1500;
  var DEPENDENT_RELIEF = 1000;

  function calcTax(chargeableIncome) {
    var remaining = Math.max(0, chargeableIncome);
    var totalTax = 0;
    var breakdown = [];

    for (var i = 0; i < GH_BANDS.length; i++) {
      var band = GH_BANDS[i];
      var income = Math.min(remaining, band.width === Infinity ? remaining : band.width);
      var amount = income * band.rate;

      if (income > 0) {
        breakdown.push({
          rate: band.rate * 100,
          income: income,
          amount: amount
        });
      }

      totalTax += amount;
      remaining -= income;

      if (remaining <= 0) break;
    }

    return { tax: totalTax, breakdown: breakdown };
  }

  function getMarginalRate(chargeableIncome) {
    var remaining = Math.max(0, chargeableIncome);

    for (var i = 0; i < GH_BANDS.length; i++) {
      var band = GH_BANDS[i];
      var width = band.width === Infinity ? remaining : band.width;
      if (remaining <= width) return band.rate * 100;
      remaining -= width;
    }

    return 35;
  }

  function calculate(grossAnnual, options) {
    options = options || {};

    var basicSalary = options.basicSalary || grossAnnual;
    var pensionableBase = Math.min(basicSalary, grossAnnual);
    var ssnitBase = Math.min(pensionableBase, SSNIT_CAP);
    var ssnit = options.ssnit === false ? 0 : ssnitBase * SSNIT_EMP_RATE;
    var tier3Cap = pensionableBase * TIER3_CAP_RATE;
    var tier3 = options.tier3 ? Math.min(options.tier3Amount || 0, tier3Cap) : 0;
    var marriage = options.marriage ? MARRIAGE_RELIEF : 0;
    var childRel = CHILD_RELIEF * Math.min(options.children || 0, MAX_CHILDREN);
    var disabled = options.disabled ? grossAnnual * 0.25 : 0;
    var oldAge = options.oldAge ? OLD_AGE_RELIEF : 0;
    var dependent = options.dependent ? DEPENDENT_RELIEF : 0;
    var totalRelief = marriage + childRel + disabled + oldAge + dependent;
    var chargeableIncome = Math.max(0, grossAnnual - ssnit - tier3 - totalRelief);
    var taxResult = calcTax(chargeableIncome);
    var employerSSNIT = ssnitBase * SSNIT_EMPLOYER_RATE;
    var totalDeductions = ssnit + tier3 + taxResult.tax;
    var netAnnual = grossAnnual - totalDeductions;

    return {
      gross: grossAnnual,
      basic: pensionableBase,
      ssnit: ssnit,
      tier3: tier3,
      tier3Cap: tier3Cap,
      marriage: marriage,
      childRel: childRel,
      disabled: disabled,
      oldAge: oldAge,
      dependent: dependent,
      totalRelief: totalRelief,
      chargeableIncome: chargeableIncome,
      tax: taxResult.tax,
      bandBreakdown: taxResult.breakdown,
      totalDeductions: totalDeductions,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: grossAnnual > 0 ? taxResult.tax / grossAnnual * 100 : 0,
      marginalRate: getMarginalRate(chargeableIncome),
      employerSSNIT: employerSSNIT,
      totalEmployerCost: grossAnnual + employerSSNIT
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
    calcBonusTax: function (bonusAmount, isResident) {
      var rate = isResident ? 0.05 : 0.10;
      return {
        gross: bonusAmount,
        tax: bonusAmount * rate,
        net: bonusAmount * (1 - rate),
        rate: rate * 100
      };
    },
    optimizeTier3: function (grossAnnual, options) {
      options = options || {};

      var basicSalary = options.basicSalary || grossAnnual;
      var maxAmount = basicSalary * TIER3_CAP_RATE;
      var step = Math.max(100, Math.round(maxAmount / 20));
      var baseResult = calculate(grossAnnual, Object.assign({}, options, { tier3: false }));
      var optimalAmount = 0;
      var bestSaving = 0;

      for (var amount = step; amount <= maxAmount; amount += step) {
        var withTier3 = calculate(grossAnnual, Object.assign({}, options, {
          tier3: true,
          tier3Amount: amount
        }));
        var saving = baseResult.tax - withTier3.tax;

        if (saving > bestSaving) {
          bestSaving = saving;
          optimalAmount = amount;
        }
      }

      return {
        optimalAmount: optimalAmount,
        maxAmount: maxAmount,
        taxSaving: bestSaving,
        newTax: baseResult.tax - bestSaving,
        baseTax: baseResult.tax
      };
    },
    GH_BANDS: GH_BANDS,
    SSNIT_CAP: SSNIT_CAP,
    SSNIT_EMP_RATE: SSNIT_EMP_RATE,
    SSNIT_EMPLOYER_RATE: SSNIT_EMPLOYER_RATE,
    TIER3_CAP_RATE: TIER3_CAP_RATE,
    country: "Ghana",
    currency: "GHS",
    id: "gh-paye"
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.ghPAYE = engine;
}(window);
