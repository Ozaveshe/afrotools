(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AlgeriaPayeEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var IRG_BANDS = [
    { min: 0, max: 240000, rate: 0 },
    { min: 240000, max: 480000, rate: 0.23 },
    { min: 480000, max: 960000, rate: 0.27 },
    { min: 960000, max: 1920000, rate: 0.30 },
    { min: 1920000, max: 3840000, rate: 0.33 },
    { min: 3840000, max: Infinity, rate: 0.35 }
  ];
  var EMPLOYEE_CNAS_RATE = 0.09;
  var EMPLOYER_CNAS_RATE = 0.25;
  var SOCIAL_WORKS_RATE = 0.005;
  var MONTHLY_EXEMPTION = 30000;
  var MONTHLY_LOW_INCOME_LIMIT = 35000;

  function finiteNonNegative(value) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0 ? number : null;
  }

  function calculateProgressiveAnnual(annualTaxable) {
    var income = finiteNonNegative(annualTaxable);
    if (income === null) return { error: 'Revenu imposable invalide' };
    var tax = 0;
    var bandBreakdown = [];
    IRG_BANDS.forEach(function (band) {
      var amount = Math.max(0, Math.min(income, band.max) - band.min);
      if (!amount && band.min !== 0) return;
      var bandTax = amount * band.rate;
      tax += bandTax;
      bandBreakdown.push({ rate: band.rate, income: amount, tax: bandTax });
    });
    return { tax: tax, bandBreakdown: bandBreakdown };
  }

  function calculateMonthlyIrg(monthlyTaxable) {
    var taxable = finiteNonNegative(monthlyTaxable);
    if (taxable === null) return { error: 'Revenu imposable mensuel invalide' };
    var progressive = calculateProgressiveAnnual(taxable * 12);
    var grossTax = progressive.tax / 12;
    if (taxable <= MONTHLY_EXEMPTION) {
      return {
        tax: 0,
        grossTax: grossTax,
        firstAbatement: grossTax,
        lowIncomeAbatement: 0,
        totalAbatement: grossTax,
        bandBreakdown: progressive.bandBreakdown
      };
    }

    var firstAbatement = Math.min(grossTax, Math.min(1500, Math.max(1000, grossTax * 0.40)));
    var afterFirstAbatement = Math.max(0, grossTax - firstAbatement);
    var finalTax = afterFirstAbatement;
    if (taxable <= MONTHLY_LOW_INCOME_LIMIT) {
      finalTax = Math.max(0, afterFirstAbatement * (137 / 51) - (27925 / 8));
    }
    var lowIncomeAbatement = Math.max(0, afterFirstAbatement - finalTax);
    return {
      tax: finalTax,
      grossTax: grossTax,
      firstAbatement: firstAbatement,
      lowIncomeAbatement: lowIncomeAbatement,
      totalAbatement: grossTax - finalTax,
      bandBreakdown: progressive.bandBreakdown
    };
  }

  function calculate(grossAnnual, options) {
    var gross = finiteNonNegative(grossAnnual);
    if (gross === null) return { error: 'Salaire brut invalide' };
    var includeCnas = !options || options.includeCnas !== false;
    var cnas = includeCnas ? gross * EMPLOYEE_CNAS_RATE : 0;
    var taxableAnnual = Math.max(0, gross - cnas);
    var irg = calculateMonthlyIrg(taxableAnnual / 12);
    var annualTax = irg.tax * 12;
    var grossAnnualTax = irg.grossTax * 12;
    var deductions = cnas + annualTax;
    var employerCnas = gross * EMPLOYER_CNAS_RATE;
    var socialWorks = gross * SOCIAL_WORKS_RATE;
    var marginalBand = irg.bandBreakdown.filter(function (band) { return band.income > 0; }).pop();

    return {
      gross: gross,
      annual: gross,
      annualGross: gross,
      monthly: false,
      cnas: cnas,
      cnasRate: includeCnas ? EMPLOYEE_CNAS_RATE : 0,
      totalSocialContrib: cnas,
      taxableAnnual: taxableAnnual,
      monthlyTaxable: taxableAnnual / 12,
      grossAnnualPAYE: grossAnnualTax,
      irgAbatementAnnual: irg.totalAbatement * 12,
      lowIncomeAbatementAnnual: irg.lowIncomeAbatement * 12,
      annualPAYE: annualTax,
      bandBreakdown: irg.bandBreakdown,
      totalEmployeeDeductions: deductions,
      netAnnual: gross - deductions,
      annualNet: gross - deductions,
      effectiveRate: gross ? annualTax / gross : 0,
      marginalRate: marginalBand ? marginalBand.rate : 0,
      empCNAS: employerCnas,
      socialWorks: socialWorks,
      totalEmployerCostAnnual: gross + employerCnas + socialWorks,
      limitations: {
        regularMonthlySalaryOnly: true,
        nonMonthlyPaymentsIncluded: false,
        disabilityAndPensionRegimeIncluded: false,
        employerReductionsIncluded: false
      }
    };
  }

  return {
    calculate: calculate,
    calculateMonthlyIrg: calculateMonthlyIrg,
    calculateProgressiveAnnual: calculateProgressiveAnnual,
    constants: {
      irgBands: IRG_BANDS,
      employeeCnasRate: EMPLOYEE_CNAS_RATE,
      employerCnasRate: EMPLOYER_CNAS_RATE,
      socialWorksRate: SOCIAL_WORKS_RATE,
      monthlyExemption: MONTHLY_EXEMPTION,
      monthlyLowIncomeLimit: MONTHLY_LOW_INCOME_LIMIT,
      sourceUrls: [
        'https://www.mfdgi.gov.dz/fr/particuliers/irg-traitements-et-salaires',
        'https://cnas.dz/fr/employeur/'
      ]
    }
  };
});
