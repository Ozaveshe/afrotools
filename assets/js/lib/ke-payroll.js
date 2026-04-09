(function (root, factory) {
  "use strict";

  var api = factory();

  if (typeof module !== "undefined" && module.exports) {
    module.exports = api;
  }

  root.AfroTools = root.AfroTools || {};
  root.AfroTools.payroll = root.AfroTools.payroll || {};
  root.AfroTools.payroll.ke = api;
}(typeof globalThis !== "undefined" ? globalThis : this, function () {
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
  var NSSF_RATE = 0.06;
  var SHIF_RATE = 0.0275;
  var SHIF_MINIMUM = 300;
  var AHL_RATE = 0.015;
  var DISABILITY_EXEMPTION = 150000;
  var MAX_VOLUNTARY_PENSION = 30000;
  var MAX_PRMF = 15000;
  var MAX_MORTGAGE_INTEREST = 30000;
  var MAX_INSURANCE_RELIEF = 5000;
  var LEGACY_NSSF_FLAT = 200;

  function round2(value) {
    return Math.round(value * 100) / 100;
  }

  function normalizeGross(monthlyGross) {
    var amount = Number(monthlyGross) || 0;
    return amount > 0 ? amount : 0;
  }

  function calcProgressiveTax(taxable) {
    var remaining = Math.max(0, taxable);
    var totalTax = 0;
    var detail = [];

    for (var i = 0; i < MONTHLY_BANDS.length; i++) {
      var band = MONTHLY_BANDS[i];
      var width = band.width === Infinity ? remaining : band.width;
      var income = Math.min(remaining, width);
      var taxInBand = income * band.rate;

      if (income > 0) {
        detail.push({
          label: band.label,
          rate: band.rate * 100,
          income: income,
          tax: round2(taxInBand),
          cumulative: round2(totalTax + taxInBand)
        });
      }

      totalTax += taxInBand;
      remaining -= income;

      if (remaining <= 0) {
        break;
      }
    }

    return { tax: totalTax, detail: detail };
  }

  function getMarginalRate(taxable) {
    var remaining = Math.max(0, taxable);

    for (var i = 0; i < MONTHLY_BANDS.length; i++) {
      var band = MONTHLY_BANDS[i];
      var width = band.width === Infinity ? remaining : band.width;
      if (remaining <= width) {
        return band.rate * 100;
      }
      remaining -= width;
    }

    return 35;
  }

  function calculateNssf(monthlyGross, regime) {
    var gross = normalizeGross(monthlyGross);
    var activeRegime = regime || "new";

    if (activeRegime !== "new") {
      return {
        regime: activeRegime,
        pensionablePay: gross,
        empTier1: LEGACY_NSSF_FLAT,
        empTier2: 0,
        erTier1: LEGACY_NSSF_FLAT,
        erTier2: 0,
        totalEmployee: LEGACY_NSSF_FLAT,
        totalEmployer: LEGACY_NSSF_FLAT,
        totalMonthly: LEGACY_NSSF_FLAT * 2,
        totalAnnual: LEGACY_NSSF_FLAT * 24
      };
    }

    var pensionablePay = Math.min(gross, NSSF_UPPER_LIMIT);
    var tier1Base = Math.min(pensionablePay, NSSF_LOWER_LIMIT);
    var tier2Base = Math.max(0, pensionablePay - NSSF_LOWER_LIMIT);
    var empTier1 = tier1Base * NSSF_RATE;
    var empTier2 = tier2Base * NSSF_RATE;
    var erTier1 = tier1Base * NSSF_RATE;
    var erTier2 = tier2Base * NSSF_RATE;
    var totalEmployee = empTier1 + empTier2;
    var totalEmployer = erTier1 + erTier2;

    return {
      regime: activeRegime,
      pensionablePay: pensionablePay,
      empTier1: empTier1,
      empTier2: empTier2,
      erTier1: erTier1,
      erTier2: erTier2,
      totalEmployee: totalEmployee,
      totalEmployer: totalEmployer,
      totalMonthly: totalEmployee + totalEmployer,
      totalAnnual: (totalEmployee + totalEmployer) * 12
    };
  }

  function calculateShif(monthlyGross) {
    var gross = normalizeGross(monthlyGross);
    return gross > 0 ? Math.max(gross * SHIF_RATE, SHIF_MINIMUM) : 0;
  }

  function calculateAhl(monthlyGross) {
    return normalizeGross(monthlyGross) * AHL_RATE;
  }

  function calculateMonthlyPayroll(monthlyGross, options) {
    options = options || {};

    var gross = normalizeGross(monthlyGross);
    var nssfResult = calculateNssf(gross, options.nssfRegime || "new");
    var nssf = options.nssf === false ? 0 : nssfResult.totalEmployee;
    var employerNssf = options.nssf === false ? 0 : nssfResult.totalEmployer;
    var shif = options.shif === false ? 0 : calculateShif(gross);
    var ahl = options.ahl ? calculateAhl(gross) : 0;
    var voluntaryPension = Math.min(MAX_VOLUNTARY_PENSION, Number(options.voluntaryPension) || 0);
    var prmf = Math.min(MAX_PRMF, Number(options.prmf) || 0);
    var mortgageInterest = Math.min(MAX_MORTGAGE_INTEREST, Number(options.mortgageInterest) || 0);
    var disabilityExempt = options.disability ? DISABILITY_EXEMPTION : 0;
    var insurancePremium = Number(options.insurancePremium) || 0;
    var personalRelief = options.personalRelief === false ? 0 : PERSONAL_RELIEF;
    var insuranceRelief = insurancePremium > 0 ? Math.min(MAX_INSURANCE_RELIEF, insurancePremium * 0.15) : 0;

    var taxable = Math.max(
      0,
      gross - nssf - shif - ahl - voluntaryPension - prmf - mortgageInterest - disabilityExempt
    );
    var taxResult = calcProgressiveTax(taxable);
    var paye = Math.max(0, taxResult.tax - personalRelief - insuranceRelief);
    var totalDeductions = nssf + shif + ahl + voluntaryPension + prmf + paye;
    var employerAhl = calculateAhl(gross);
    var totalEmployerCost = gross + employerNssf + employerAhl;

    return {
      gross: gross,
      nssf: nssf,
      nssfBreakdown: nssfResult,
      shif: shif,
      ahl: ahl,
      voluntaryPension: voluntaryPension,
      prmf: prmf,
      disabilityExempt: disabilityExempt,
      mortgageInterest: mortgageInterest,
      taxable: taxable,
      grossTax: taxResult.tax,
      personalRelief: personalRelief,
      insuranceRelief: insuranceRelief,
      paye: paye,
      totalDeductions: totalDeductions,
      net: gross - totalDeductions,
      netAnnual: (gross - totalDeductions) * 12,
      effectiveRate: gross > 0 ? paye / gross * 100 : 0,
      marginalRate: getMarginalRate(taxable),
      bandDetail: taxResult.detail,
      employerNSSF: employerNssf,
      employerAHL: employerAhl,
      totalEmployerCost: totalEmployerCost
    };
  }

  function calculateStatutoryBurden(monthlyGross, regime) {
    var gross = normalizeGross(monthlyGross);
    var nssf = calculateNssf(gross, regime || "new");
    var shif = calculateShif(gross);
    var ahl = calculateAhl(gross);

    return {
      gross: gross,
      nssf: nssf,
      employee: {
        nssf: nssf.totalEmployee,
        shif: shif,
        ahl: ahl,
        total: nssf.totalEmployee + shif + ahl
      },
      employer: {
        nssf: nssf.totalEmployer,
        shif: 0,
        ahl: ahl,
        total: nssf.totalEmployer + ahl
      }
    };
  }

  return {
    MONTHLY_BANDS: MONTHLY_BANDS,
    PERSONAL_RELIEF: PERSONAL_RELIEF,
    NSSF_LOWER_LIMIT: NSSF_LOWER_LIMIT,
    NSSF_UPPER_LIMIT: NSSF_UPPER_LIMIT,
    NSSF_RATE: NSSF_RATE,
    SHIF_RATE: SHIF_RATE,
    SHIF_MINIMUM: SHIF_MINIMUM,
    AHL_RATE: AHL_RATE,
    LEGACY_NSSF_FLAT: LEGACY_NSSF_FLAT,
    DISABILITY_EXEMPTION: DISABILITY_EXEMPTION,
    MAX_VOLUNTARY_PENSION: MAX_VOLUNTARY_PENSION,
    MAX_PRMF: MAX_PRMF,
    MAX_MORTGAGE_INTEREST: MAX_MORTGAGE_INTEREST,
    MAX_INSURANCE_RELIEF: MAX_INSURANCE_RELIEF,
    calculateNssf: calculateNssf,
    calculateShif: calculateShif,
    calculateAhl: calculateAhl,
    calculateMonthlyPayroll: calculateMonthlyPayroll,
    calculateStatutoryBurden: calculateStatutoryBurden,
    calcProgressiveTax: calcProgressiveTax,
    getMarginalRate: getMarginalRate
  };
}));
