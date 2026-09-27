(function (window) {
  'use strict';

  // GRA Income Tax (Amendment) Act, 2026 (Act 1178), effective 1 September 2026.
  // The widths are annual chargeable-income bands in GHS.
  var GH_BANDS = [
    { width: 7056, rate: 0 },
    { width: 960, rate: 0.05 },
    { width: 1200, rate: 0.10 },
    { width: 34800, rate: 0.175 },
    { width: 192000, rate: 0.25 },
    { width: 363984, rate: 0.30 },
    { width: Infinity, rate: 0.35 }
  ];
  // SSNIT's 2026 notice sets a GHS 69,000 monthly maximum insurable earning.
  // Inputs to this engine are annual, so the annual maximum base is 12 times that.
  var SSNIT_CAP = 69000 * 12;
  var SSNIT_EMP_RATE = 0.055;
  var SSNIT_EMPLOYER_RATE = 0.13;
  var TIER3_CAP_RATE = 0.165;

  function calcBands(chargeableIncome) {
    var remaining = Math.max(0, chargeableIncome);
    var tax = 0;
    var breakdown = [];
    for (var i = 0; i < GH_BANDS.length && remaining > 0; i++) {
      var band = GH_BANDS[i];
      var income = Math.min(remaining, band.width);
      var amount = income * band.rate;
      breakdown.push({ rate: band.rate * 100, income: income, amount: amount });
      tax += amount;
      remaining -= income;
    }
    return { tax: tax, breakdown: breakdown };
  }

  function marginalRate(chargeableIncome) {
    var remaining = Math.max(0, chargeableIncome);
    for (var i = 0; i < GH_BANDS.length; i++) {
      if (remaining <= GH_BANDS[i].width) return GH_BANDS[i].rate * 100;
      remaining -= GH_BANDS[i].width;
    }
    return 35;
  }

  function calculate(grossAnnual, opts) {
    opts = opts || {};
    var basic = Math.min(opts.basicSalary || grossAnnual, grossAnnual);
    var ssnitBase = Math.min(basic, SSNIT_CAP);
    var ssnit = opts.ssnit === false ? 0 : ssnitBase * SSNIT_EMP_RATE;
    var tier3Cap = basic * TIER3_CAP_RATE;
    var tier3 = opts.tier3 ? Math.min(opts.tier3Amount || 0, tier3Cap) : 0;
    var marriage = opts.marriage ? 1200 : 0;
    var childRel = 600 * Math.min(opts.children || 0, 3);
    var disabled = opts.disabled ? grossAnnual * 0.25 : 0;
    var oldAge = opts.oldAge ? 1500 : 0;
    var dependent = opts.dependent ? 1000 : 0;
    var totalRelief = marriage + childRel + disabled + oldAge + dependent;
    var chargeableIncome = Math.max(0, grossAnnual - ssnit - tier3 - totalRelief);
    var bands = calcBands(chargeableIncome);
    var employerSSNIT = ssnitBase * SSNIT_EMPLOYER_RATE;
    var totalDeductions = ssnit + tier3 + bands.tax;
    var netAnnual = grossAnnual - totalDeductions;
    return {
      gross: grossAnnual, basic: basic, ssnit: ssnit, tier3: tier3,
      tier3Cap: tier3Cap, marriage: marriage, childRel: childRel,
      disabled: disabled, oldAge: oldAge, dependent: dependent,
      totalRelief: totalRelief, chargeableIncome: chargeableIncome,
      tax: bands.tax, bandBreakdown: bands.breakdown,
      totalDeductions: totalDeductions, netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: grossAnnual > 0 ? bands.tax / grossAnnual * 100 : 0,
      marginalRate: marginalRate(chargeableIncome),
      employerSSNIT: employerSSNIT,
      totalEmployerCost: grossAnnual + employerSSNIT
    };
  }

  function reverseCalc(netAnnual, opts) {
    var low = netAnnual;
    var high = netAnnual * 3;
    for (var i = 0; i < 50; i++) {
      var guess = (low + high) / 2;
      var result = calculate(guess, opts);
      if (Math.abs(result.netAnnual - netAnnual) < 1) return guess;
      if (result.netAnnual < netAnnual) low = guess;
      else high = guess;
    }
    return (low + high) / 2;
  }

  function optimizeTier3(grossAnnual, opts) {
    opts = opts || {};
    var maxAmount = (opts.basicSalary || grossAnnual) * TIER3_CAP_RATE;
    var step = Math.max(100, Math.round(maxAmount / 20));
    var baseTax = calculate(grossAnnual, Object.assign({}, opts, { tier3: false })).tax;
    var optimalAmount = 0;
    var taxSaving = 0;
    for (var amount = step; amount <= maxAmount; amount += step) {
      var saving = baseTax - calculate(grossAnnual, Object.assign({}, opts, {
        tier3: true, tier3Amount: amount
      })).tax;
      if (saving > taxSaving) {
        optimalAmount = amount;
        taxSaving = saving;
      }
    }
    return { optimalAmount: optimalAmount, maxAmount: maxAmount,
      taxSaving: taxSaving, newTax: baseTax - taxSaving, baseTax: baseTax };
  }

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.ghPAYE = {
    calculate: calculate,
    validate: function (amount) {
      return !amount || isNaN(amount) || amount <= 0
        ? { valid: false, error: 'Please enter a valid salary amount' }
        : { valid: true, error: null };
    },
    reverseCalc: reverseCalc,
    calcBonusTax: function (amount, resident) {
      var rate = resident ? 0.05 : 0.10;
      return { gross: amount, tax: amount * rate, net: amount * (1 - rate), rate: rate * 100 };
    },
    optimizeTier3: optimizeTier3,
    GH_BANDS: GH_BANDS,
    SSNIT_CAP: SSNIT_CAP,
    SSNIT_EMP_RATE: SSNIT_EMP_RATE,
    SSNIT_EMPLOYER_RATE: SSNIT_EMPLOYER_RATE,
    TIER3_CAP_RATE: TIER3_CAP_RATE,
    country: 'Ghana', currency: 'GHS', id: 'gh-paye'
  };
})(window);
