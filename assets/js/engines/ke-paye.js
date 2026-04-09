!function (window) {
  "use strict";

  var MONTHLY_BANDS = [
    { width: 24000, rate: 0.10, label: "First KES 24,000" },
    { width: 8333, rate: 0.25, label: "KES 24,001-32,333" },
    { width: 467667, rate: 0.30, label: "KES 32,334-500,000" },
    { width: 300000, rate: 0.325, label: "KES 500,001-800,000" },
    { width: Infinity, rate: 0.35, label: "Above KES 800,000" }
  ];

  var PERSONAL_RELIEF = 2400;
  var NSSF_LOWER_LIMIT = 9000;
  var NSSF_UPPER_LIMIT = 108000;
  var DISABILITY_EXEMPTION = 150000;
  var MAX_VOLUNTARY_PENSION = 30000;
  var MAX_PRMF = 15000;
  var MAX_MORTGAGE_INTEREST = 30000;
  var MAX_INSURANCE_RELIEF = 5000;

  function calcNssf(gross) {
    if (gross <= 0) return 0;
    return 0.06 * Math.min(gross, NSSF_UPPER_LIMIT);
  }

  function calcProgressiveTax(taxable) {
    var remaining = Math.max(0, taxable);
    var totalTax = 0;
    var detail = [];

    for (var i = 0; i < MONTHLY_BANDS.length; i++) {
      var band = MONTHLY_BANDS[i];
      var income = Math.min(remaining, band.width === Infinity ? remaining : band.width);
      var taxInBand = income * band.rate;

      detail.push({
        label: band.label,
        rate: band.rate * 100,
        income: income,
        tax: taxInBand,
        cumulative: totalTax + taxInBand
      });

      totalTax += taxInBand;
      remaining -= income;

      if (remaining <= 0) break;
    }

    return { tax: totalTax, detail: detail };
  }

  function getMarginalRate(taxable) {
    var remaining = Math.max(0, taxable);

    for (var i = 0; i < MONTHLY_BANDS.length; i++) {
      var band = MONTHLY_BANDS[i];
      var width = band.width === Infinity ? remaining : band.width;
      if (remaining <= width) return band.rate * 100;
      remaining -= width;
    }

    return 35;
  }

  function calculate(gross, options) {
    options = options || {};

    var nssf = options.nssf === false ? 0 : calcNssf(gross);
    var shif = options.shif === false || gross <= 0 ? 0 : Math.max(300, gross * 0.0275);
    var ahl = options.ahl ? gross * 0.015 : 0;
    var pension = options.voluntaryPension ? Math.min(MAX_VOLUNTARY_PENSION, options.voluntaryPension) : 0;
    var prmf = options.prmf ? Math.min(MAX_PRMF, options.prmf) : 0;
    var disabilityExempt = options.disability ? DISABILITY_EXEMPTION : 0;
    var mortRelief = options.mortgageInterest ? Math.min(MAX_MORTGAGE_INTEREST, options.mortgageInterest) : 0;
    var taxable = Math.max(0, gross - nssf - shif - ahl - pension - prmf - disabilityExempt - mortRelief);
    var taxResult = calcProgressiveTax(taxable);
    var personalRelief = options.personalRelief === false ? 0 : PERSONAL_RELIEF;
    var insRelief = options.insurancePremium ? Math.min(MAX_INSURANCE_RELIEF, options.insurancePremium * 0.15) : 0;
    var paye = Math.max(0, taxResult.tax - personalRelief - insRelief);
    var totalDeductions = nssf + shif + ahl + pension + prmf + paye;
    var net = gross - totalDeductions;
    var employerNssf = calcNssf(gross);
    var employerAhl = gross * 0.015;

    return {
      gross: gross,
      nssf: nssf,
      shif: shif,
      ahl: ahl,
      pension: pension,
      prmf: prmf,
      disabilityExempt: disabilityExempt,
      taxable: taxable,
      grossTax: taxResult.tax,
      personalRelief: personalRelief,
      insRelief: insRelief,
      mortRelief: mortRelief,
      paye: paye,
      totalDeductions: totalDeductions,
      net: net,
      netAnnual: net * 12,
      effectiveRate: gross > 0 ? paye / gross * 100 : 0,
      marginalRate: getMarginalRate(taxable),
      bandDetail: taxResult.detail,
      employerNSSF: employerNssf,
      employerAHL: employerAhl,
      totalEmployerCost: gross + employerNssf + employerAhl
    };
  }

  var engine = {
    calculate: calculate,
    validate: function (gross) {
      if (!gross || isNaN(gross) || gross <= 0) {
        return { valid: false, error: "Please enter a valid salary amount" };
      }

      if (gross > 100000000) {
        return { valid: false, error: "Amount exceeds maximum" };
      }

      return { valid: true, error: null };
    },
    reverseCalc: function (targetNet, options) {
      var low = targetNet;
      var high = targetNet * 3;

      for (var i = 0; i < 50; i++) {
        var guess = (low + high) / 2;
        var result = calculate(guess, options);

        if (Math.abs(result.net - targetNet) < 1) {
          return guess;
        }

        if (result.net < targetNet) {
          low = guess;
        } else {
          high = guess;
        }
      }

      return (low + high) / 2;
    },
    calcNSSF: calcNssf,
    KES_BANDS: MONTHLY_BANDS,
    NSSF_LEL: NSSF_LOWER_LIMIT,
    NSSF_UEL: NSSF_UPPER_LIMIT,
    PERSONAL_RELIEF: PERSONAL_RELIEF,
    country: "Kenya",
    currency: "KES",
    id: "ke-paye"
  };

  window.AfroTools = window.AfroTools || {};
  window.AfroTools.engines = window.AfroTools.engines || {};
  window.AfroTools.engines.kePAYE = engine;
}(window);
