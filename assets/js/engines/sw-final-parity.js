(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.swFinalParity = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : (fallback || 0);
  }

  function progressiveTax(income, bands) {
    var taxable = Math.max(0, finite(income));
    var previous = 0;
    var tax = 0;
    var breakdown = [];
    bands.forEach(function (band) {
      var ceiling = band[0] === null ? Infinity : finite(band[0]);
      var slice = Math.max(0, Math.min(taxable, ceiling) - previous);
      if (slice > 0) {
        var amount = slice * finite(band[1]);
        breakdown.push({ from: previous, to: ceiling, rate: finite(band[1]), income: slice, tax: amount });
        tax += amount;
      }
      previous = ceiling;
    });
    return { tax: Math.max(0, tax), breakdown: breakdown };
  }

  var PAYE_PROFILES = {
    'ng-paye': { country: 'Nigeria', currency: 'NGN', period: 'annual', bands: [[800000,0],[3000000,.15],[12000000,.18],[25000000,.21],[50000000,.23],[null,.25]], source: 'https://www.nrs.gov.ng/uploads/NIGERIA_TAX_ADMINISTRATION_ACT_2025_8c945071a7.pdf', reviewed: '2026-03-01', options: ['regime','pension','nhf','nhis','annualRent','lifeAssurance','mortgageInterest'] },
    'za-paye': { country: 'Afrika Kusini', currency: 'ZAR', period: 'annual', bands: [[237100,.18],[370500,.26],[512800,.31],[673000,.36],[857900,.39],[1817000,.41],[null,.45]], source: 'https://www.sars.gov.za/tax-rates/income-tax/rates-of-tax-for-individuals/', reviewed: '2026-01-01', options: ['ageGroup','retirement','medMembers','uif'] },
    'ma-paye': { country: 'Moroko', currency: 'MAD', period: 'annual', bands: [[30000,0],[50000,.10],[60000,.20],[80000,.30],[180000,.34],[null,.38]], source: 'https://www.finances.gov.ma/Publication/dgi/2025/CGI-2026-FR.pdf', reviewed: '2025-01-01', options: ['cnss','amo'] },
    'dz-paye': { country: 'Aljeria', currency: 'DZD', period: 'annual', bands: [[240000,0],[480000,.20],[960000,.30],[null,.35]], employeeRate: .09, employeeCap: null, rebate: 0, source: 'https://www.mfdgi.gov.dz/', reviewed: '2026-04-06' },
    'tn-paye': { country: 'Tunisia', currency: 'TND', period: 'annual', bands: [[5000,0],[20000,.26],[30000,.28],[50000,.32],[null,.35]], employeeRate: .0918, employeeCap: null, salaryDeductionRate: .10, salaryDeductionCap: 2000, rebate: 0, source: 'https://www.finances.gov.tn/fr/apercu-general-sur-la-fiscalite', reviewed: '2026-08-09', options: ['cnss','salaryDeduction'] },
    'ly-paye': { country: 'Libya', currency: 'LYD', period: 'monthly', bands: [[1000,.05],[null,.10]], employeeRate: .06125, employeeCap: null, rebate: 0, postTaxRate: .005, source: 'https://mof.gov.ly/', reviewed: '2026-08-09', confidence: 'manual' },
    'sd-paye': { country: 'Sudan', currency: 'SDG', period: 'monthly', bands: [[10000,0],[40000,.05],[70000,.10],[null,.15]], employeeRate: .08, employeeCap: null, rebate: 0, source: 'https://tax.gov.sd/en/tax-laws/', reviewed: '2026-01-01' },
    'mz-paye': { country: 'Msumbiji', currency: 'MZN', period: 'monthly', bands: [[3500,.10],[14000,.15],[42000,.20],[126000,.25],[null,.32]], employeeRate: .03, employeeCap: null, rebate: 0, source: 'https://www.at.gov.mz/por/Comercio-Internacional/Procedimento-Fiscais/Taxas-IRPS', reviewed: '2026-04-06' },
    'na-paye': { country: 'Namibia', currency: 'NAD', period: 'annual', bands: [[100000,0],[150000,.18],[350000,.25],[550000,.28],[850000,.30],[1550000,.32],[null,.37]], employeeRate: .009, employeeCap: 1188, taxableDeductContribution: false, rebate: 0, source: 'https://www.itas.namra.org.na/', reviewed: '2026-01-01' },
    'mg-paye': { country: 'Madagaska', currency: 'MGA', period: 'monthly', bands: [[350000,0],[400000,.05],[500000,.10],[600000,.15],[null,.20]], employeeRate: .01, employeeCap: 21014.4, rebate: 0, minimumTax: 3000, minimumTaxThreshold: 350000, dependentRelief: 2000, maxDependents: 10, source: 'https://www.impots.mg/explorer?path=/legislation/Codes%20et%20Manuels/CDI-LFI%202026.pdf', reviewed: '2026-03-28', options: ['cnaps','dependents'] },
    'cd-paye': { country: 'DR Congo', currency: 'CDF', period: 'annual', bands: [[524160,0],[1428000,.03],[2700000,.05],[4620000,.10],[7260000,.15],[10260000,.20],[13908000,.25],[16824000,.30],[21168000,.35],[null,.40]], employeeRate: .05, employeeCap: null, rebate: 0, source: 'https://dgi.gouv.cd/teledeclaration/', reviewed: '2026-04-06' },
    'cg-paye': { country: 'Jamhuri ya Congo', currency: 'XAF', period: 'monthly', bands: [[464000,0],[1000000,.01],[3000000,.10],[8000000,.25],[13500000,.40],[null,.45]], employeeRate: .04, employeeCap: 48000, rebate: 0, taxAnnualized: true, source: 'https://impots.gouv.cg/portail-client-web/public/accueil.xhtml', reviewed: '2026-03-28' },
    'sl-paye': { country: 'Sierra Leone', currency: 'SLE', period: 'monthly', bands: [[600,0],[1200,.15],[1800,.20],[2400,.25],[null,.30]], employeeRate: .05, employeeCap: null, rebate: 0, source: 'https://nra.gov.sl/', reviewed: '2026-04-01', options: ['nassit','secondary'] }
  };

  function calculatePaye(id, input) {
    var profile = PAYE_PROFILES[id];
    if (!profile) throw new Error('Unknown PAYE profile: ' + id);
    var gross = finite(input && input.gross);
    if (!(gross > 0)) throw new RangeError('Gross must be positive');
    input = input || {};
    var components = {};
    var contribution = 0;
    var taxable;
    var taxResult;
    var tax;
    var relief = 0;
    var postTax = 0;

    if (id === 'ng-paye') {
      var regime = String(input.regime || 'NTA_2026').toUpperCase();
      var pensionBase = finite(input.pensionableEmoluments, gross) || gross;
      components.pension = input.pension === false ? 0 : pensionBase * .08;
      components.nhf = input.nhf === false ? 0 : gross * .025;
      components.nhis = input.nhis === true ? gross * finite(input.nhisRate, .05) : 0;
      components.lifeAssurance = Math.max(0, finite(input.lifeAssurance));
      components.mortgageInterest = Math.min(500000, Math.max(0, finite(input.mortgageInterest)));
      contribution = components.pension + components.nhf + components.nhis + components.lifeAssurance + components.mortgageInterest;
      if (regime === 'PITA_2025' || regime === 'PITA') {
        relief = Math.max(200000, gross * .01) + gross * .20;
        taxable = Math.max(0, gross - contribution - relief);
        taxResult = progressiveTax(taxable, [[300000,.07],[600000,.11],[1100000,.15],[1600000,.19],[3200000,.21],[null,.24]]);
        tax = taxable > 0 ? Math.max(taxResult.tax, gross * .01) : 0;
        if (gross <= 840000) tax = 0;
      } else {
        relief = Math.min(Math.max(0, finite(input.annualRent)) * .20, 500000);
        taxable = Math.max(0, gross - contribution - relief);
        taxResult = progressiveTax(taxable, profile.bands);
        tax = taxResult.tax;
      }
    } else if (id === 'za-paye') {
      components.uif = input.uif === false ? 0 : Math.min(gross, 212544) * .01;
      contribution = components.uif;
      var retirement = Math.min(Math.max(0, finite(input.retirement)), gross * .275, 350000);
      taxable = Math.max(0, gross - retirement);
      taxResult = progressiveTax(taxable, profile.bands);
      var rebates = { under65:17235, '65to74':26679, '75plus':29824 };
      var ageGroup = input.ageGroup || 'under65';
      var medMembers = Math.max(0, Math.floor(finite(input.medMembers)));
      var medicalMonthly = medMembers > 0 ? 364 + (medMembers > 1 ? 364 : 0) + Math.max(0, medMembers - 2) * 246 : 0;
      relief = (rebates[ageGroup] || rebates.under65) + medicalMonthly * 12;
      tax = Math.max(0, taxResult.tax - relief);
      components.retirement = retirement;
      components.medicalCredit = medicalMonthly * 12;
    } else if (id === 'ma-paye') {
      components.cnss = input.cnss === false ? 0 : Math.min(gross, 72000) * .0448;
      components.amo = input.amo === false ? 0 : gross * .0226;
      contribution = components.cnss + components.amo;
      taxable = Math.max(0, gross - contribution);
      taxResult = progressiveTax(taxable, profile.bands);
      tax = taxResult.tax;
    } else if (id === 'sl-paye' && input.secondary === true) {
      components.nassit = input.nassit === false ? 0 : gross * .05;
      contribution = components.nassit;
      taxable = gross;
      tax = gross * .30;
      taxResult = { tax:tax, breakdown:[{ from:0, to:gross, rate:.30, income:gross, tax:tax, isFlat:true }] };
    } else {
      var includeContribution = input.includeContribution !== false && input.cnss !== false && input.cnaps !== false && input.nassit !== false;
      contribution = includeContribution ? Math.min(gross * profile.employeeRate, profile.employeeCap === null ? Infinity : profile.employeeCap) : 0;
      components.employee = contribution;
      var salaryDeduction = Math.min(gross * finite(profile.salaryDeductionRate), finite(profile.salaryDeductionCap));
      taxable = Math.max(0, gross - (profile.taxableDeductContribution === false ? 0 : contribution) - salaryDeduction);
      if (salaryDeduction) components.salaryDeduction = salaryDeduction;
      taxResult = progressiveTax(profile.taxAnnualized ? taxable * 12 : taxable, profile.bands);
      tax = Math.max(0, taxResult.tax / (profile.taxAnnualized ? 12 : 1) - finite(profile.rebate));
      if (profile.minimumTax && taxable > profile.minimumTaxThreshold && tax > 0) {
        var dependents = Math.min(profile.maxDependents || 0, Math.max(0, Math.floor(finite(input.dependents))));
        relief = dependents * finite(profile.dependentRelief);
        tax = Math.max(profile.minimumTax, Math.max(profile.minimumTax, tax) - relief);
        components.dependentRelief = relief;
        components.dependents = dependents;
      }
      postTax = Math.max(0, gross - contribution - tax) * finite(profile.postTaxRate);
    }
    return { id:id, country:profile.country, currency:profile.currency, period:profile.period, gross:gross, contribution:contribution, components:components, relief:relief, taxable:taxable, tax:tax, postTax:postTax, net:Math.max(0,gross-contribution-tax-postTax), effectiveRate:gross ? (tax+postTax)/gross : 0, breakdown:taxResult.breakdown, source:profile.source, reviewed:profile.reviewed, confidence:profile.confidence || 'verified-snapshot' };
  }

  return { progressiveTax:progressiveTax, PAYE_PROFILES:PAYE_PROFILES, calculatePaye:calculatePaye };
}));
