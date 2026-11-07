(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.SenegalPayeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var IRPP_BANDS = [
    { min: 0, max: 630000, rate: 0 },
    { min: 630000, max: 1500000, rate: 0.20 },
    { min: 1500000, max: 4000000, rate: 0.30 },
    { min: 4000000, max: 8000000, rate: 0.35 },
    { min: 8000000, max: 13500000, rate: 0.37 },
    { min: 13500000, max: 50000000, rate: 0.40 },
    { min: 50000000, max: Infinity, rate: 0.43 }
  ];
  var IPRES_GENERAL_ANNUAL_CEILING = 5184000;
  var IPRES_EMPLOYEE_RATE = 0.056;
  var IPRES_EMPLOYER_RATE = 0.084;

  function finiteNonNegative(value) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function calculateIrpp(taxableAnnual) {
    var income = finiteNonNegative(taxableAnnual);
    if (income === null) return { error: 'Revenu imposable invalide' };
    // CGI article 173: round annual taxable income down to the nearest 1,000 XOF.
    income = Math.floor(income / 1000) * 1000;
    var tax = 0;
    var breakdown = [];
    IRPP_BANDS.forEach(function (band) {
      var amount = Math.max(0, Math.min(income, band.max) - band.min);
      if (!amount && band.min !== 0) return;
      var bandTax = amount * band.rate;
      tax += bandTax;
      breakdown.push({ rate: band.rate, income: amount, tax: bandTax });
    });
    return { tax: tax, bandBreakdown: breakdown };
  }

  function calculate(grossAnnual, options) {
    var gross = finiteNonNegative(grossAnnual);
    if (gross === null || gross === 0) return { error: 'Salaire brut invalide' };
    var includeIpres = !options || options.includeIpres !== false;
    var ipresBase = includeIpres ? Math.min(gross, IPRES_GENERAL_ANNUAL_CEILING) : 0;
    var employeeIpres = ipresBase * IPRES_EMPLOYEE_RATE;
    var employerIpres = ipresBase * IPRES_EMPLOYER_RATE;
    // CGI articles 168/182: this allowance represents pension contributions and job expenses.
    // IPRES is still a cash deduction, but must not also reduce the tax base separately.
    var salaryAllowance = Math.min(gross * 0.30, 900000);
    var taxableBeforeRounding = Math.max(0, gross - salaryAllowance);
    var taxableAnnual = Math.floor(taxableBeforeRounding / 1000) * 1000;
    var irpp = calculateIrpp(taxableAnnual);
    var deductions = employeeIpres + irpp.tax;
    return {
      gross: gross,
      annual: gross,
      ipres: employeeIpres,
      ipresBase: ipresBase,
      ipresRate: includeIpres ? IPRES_EMPLOYEE_RATE : 0,
      css: 0,
      cssRate: 0,
      totalSocialContrib: employeeIpres,
      salaryAllowance: salaryAllowance,
      taxableBeforeRounding: taxableBeforeRounding,
      taxableAnnual: taxableAnnual,
      empIPRES: employerIpres,
      empCSS: 0,
      annualPAYE: irpp.tax,
      bandBreakdown: irpp.bandBreakdown,
      totalEmployeeDeductions: deductions,
      netAnnual: gross - deductions,
      effectiveRate: gross ? irpp.tax / gross : 0,
      totalEmployerCostAnnual: gross + employerIpres,
      limitations: {
        salaryAllowanceIncluded: true,
        familyReductionIncluded: false,
        minimumFiscalTaxIncluded: false,
        cadresSupplementIncluded: false,
        cssEmployerIncluded: false
      }
    };
  }

  return {
    calculate: calculate,
    calculateIrpp: calculateIrpp,
    constants: {
      irppBands: IRPP_BANDS,
      salaryAllowanceRate: 0.30,
      salaryAllowanceAnnualCap: 900000,
      taxableRoundingStep: 1000,
      ipresGeneralAnnualCeiling: IPRES_GENERAL_ANNUAL_CEILING,
      ipresEmployeeRate: IPRES_EMPLOYEE_RATE,
      ipresEmployerRate: IPRES_EMPLOYER_RATE
    }
  };
});
