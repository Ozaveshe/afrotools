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

  // DGID CGI articles 174–179 and 275–282. Resident, stable twelve-month salary.
  var FAMILY_RELIEF = [
    [1, 0, 0, 0], [1.5, .10, 100000, 300000], [2, .15, 200000, 650000],
    [2.5, .20, 300000, 1100000], [3, .25, 400000, 1650000],
    [3.5, .30, 500000, 2030000], [4, .35, 600000, 2490000],
    [4.5, .40, 700000, 2755000], [5, .45, 800000, 3180000]
  ];
  var TRIMF_BANDS = [[600000, 900], [1000000, 3600], [2000000, 4800],
    [7000000, 12000], [12000000, 18000], [Infinity, 36000]];

  function present(value) { return value !== undefined && value !== null && value !== ''; }
  function count(value, fallback) {
    if (!present(value)) return fallback;
    if (typeof value === 'boolean') return null;
    var number = Number(value);
    return Number.isSafeInteger(number) && number >= 0 ? number : null;
  }
  function calculateFamilyRelief(grossTax, parts) {
    var tax = finiteNonNegative(grossTax);
    var rule = FAMILY_RELIEF.find(function (row) { return row[0] === Number(parts); });
    if (tax === null || !rule) return { error: 'Parts fiscales invalides : de 1 à 5 par demi-part.' };
    var reduction = Math.min(tax, Math.max(rule[2], Math.min(tax * rule[1], rule[3])));
    return { parts: rule[0], rate: rule[1], minimum: rule[2], maximum: rule[3], reduction: reduction, netTax: tax - reduction };
  }
  function calculateHousehold(grossAnnual, grossTax, options) {
    var opts = options || {};
    var gross = finiteNonNegative(grossAnnual);
    if (gross === null || gross <= 0) return { error: 'Salaire brut invalide' };
    var status = opts.familyStatus || 'single';
    if (!['single', 'married', 'divorced', 'widowed'].includes(status)) return { error: 'Situation familiale invalide' };
    var children = count(opts.dependentChildren, 0);
    if (children === null) return { error: 'Indiquez un nombre entier d’enfants fiscalement à charge.' };
    var married = status === 'married';
    if (married && typeof opts.soleTaxableEarner !== 'boolean') return { error: 'Précisez si vous êtes le seul conjoint ayant des revenus imposables.' };
    var spouses = count(opts.spousesWithoutIncome, married ? null : 0);
    if (spouses === null || (!married && spouses !== 0)) return { error: 'Précisez le nombre de conjoints sans aucun revenu.' };
    var derivedParts = ((married || (status === 'widowed' && children > 0)) ? 1.5 : 1) + children * .5;
    if (married && opts.soleTaxableEarner) derivedParts += .5;
    derivedParts = Math.min(5, derivedParts);
    var parts = present(opts.confirmedParts) ? Number(opts.confirmedParts) : derivedParts;
    if (typeof opts.confirmedParts === 'boolean') return { error: 'Parts fiscales confirmées invalides.' };
    var family = calculateFamilyRelief(grossTax, parts);
    if (family.error) return family;
    var liablePersons = count(opts.confirmedTrimfPersons, 1 + spouses);
    if (liablePersons === null) return { error: 'Le nombre de personnes imposables à la TRIMF doit être un entier positif ou zéro.' };
    var perPerson = TRIMF_BANDS.find(function (band) { return gross < band[0]; })[1];
    var trimf = perPerson * liablePersons;
    if (!Number.isSafeInteger(trimf)) return { error: 'Nombre de personnes TRIMF trop élevé.' };
    return { familyParts: parts, derivedParts: derivedParts, familyReduction: family.reduction,
      familyReliefRate: family.rate, familyReliefMinimum: family.minimum, familyReliefMaximum: family.maximum,
      annualPAYE: family.netTax, trimf: trimf, trimfPerPerson: perPerson, trimfPersons: liablePersons,
      assumptions: { familyStatus: status, dependentChildren: children,
        soleTaxableEarner: married ? opts.soleTaxableEarner : false, spousesWithoutIncome: spouses,
        confirmedParts: present(opts.confirmedParts) ? parts : null,
        confirmedTrimfPersons: present(opts.confirmedTrimfPersons) ? liablePersons : null,
        resident: true, months: 12, stableCashSalary: true } };
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
    var household = calculateHousehold(gross, irpp.tax, options);
    if (household.error) return household;
    var deductions = employeeIpres + household.annualPAYE + household.trimf;
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
      grossAnnualPAYE: irpp.tax,
      annualPAYE: household.annualPAYE,
      familyParts: household.familyParts,
      familyReduction: household.familyReduction,
      familyReliefRate: household.familyReliefRate,
      trimf: household.trimf,
      trimfPerPerson: household.trimfPerPerson,
      trimfPersons: household.trimfPersons,
      assumptions: household.assumptions,
      bandBreakdown: irpp.bandBreakdown,
      totalEmployeeDeductions: deductions,
      netAnnual: gross - deductions,
      netMonthly: (gross - deductions) / 12,
      effectiveRate: gross ? household.annualPAYE / gross : 0,
      totalEmployerCostAnnual: gross + employerIpres,
      limitations: {
        salaryAllowanceIncluded: true,
        familyReductionIncluded: true,
        minimumFiscalTaxIncluded: true,
        cadresSupplementIncluded: false,
        cssEmployerIncluded: false
      }
    };
  }

  return {
    calculate: calculate,
    calculateIrpp: calculateIrpp,
    calculateFamilyRelief: calculateFamilyRelief,
    calculateHousehold: calculateHousehold,
    constants: {
      irppBands: IRPP_BANDS,
      familyRelief: FAMILY_RELIEF,
      trimfBands: TRIMF_BANDS,
      salaryAllowanceRate: 0.30,
      salaryAllowanceAnnualCap: 900000,
      taxableRoundingStep: 1000,
      ipresGeneralAnnualCeiling: IPRES_GENERAL_ANNUAL_CEILING,
      ipresEmployeeRate: IPRES_EMPLOYEE_RATE,
      ipresEmployerRate: IPRES_EMPLOYER_RATE
    }
  };
});
