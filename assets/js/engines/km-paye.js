(function (root) {
  'use strict';

  var TAX_BANDS = [
    { width: 150000, rate: 0 },
    { width: 350000, rate: 0.05 },
    { width: 500000, rate: 0.10 },
    { width: 500000, rate: 0.15 },
    { width: 1000000, rate: 0.20 },
    { width: 1000000, rate: 0.25 },
    { width: Infinity, rate: 0.30 }
  ];
  var STANDARD_PROFESSIONAL_EXPENSE_RATE = 0.30;
  var MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE = 0.06;

  function calculateAnnualTax(taxableAnnual) {
    var income = Number(taxableAnnual);
    if (!Number.isFinite(income) || income <= 0) return { tax: 0, bands: [] };

    var remaining = income;
    var lower = 0;
    var tax = 0;
    var detail = [];
    TAX_BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({
        from: lower,
        to: band.width === Infinity ? null : lower + band.width,
        rate: band.rate,
        income: slice,
        tax: bandTax
      });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) lower += band.width;
    });
    return { tax: tax, bands: detail };
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter monthly gross employment income of zero or more.' };
    }

    var employeeContributionRate = input.employeeContributionRate == null
      ? 0
      : Number(input.employeeContributionRate);
    if (!Number.isFinite(employeeContributionRate) || employeeContributionRate < 0 || employeeContributionRate > MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE) {
      return { ok: false, error: 'Enter an approved employee pension or social contribution rate from 0% to 6%.' };
    }

    var grossAnnual = grossMonthly * 12;
    var employeeContributionAnnual = grossAnnual * employeeContributionRate;
    var incomeAfterContribution = grossAnnual - employeeContributionAnnual;
    var professionalExpenseDeductionAnnual = incomeAfterContribution * STANDARD_PROFESSIONAL_EXPENSE_RATE;
    var taxableAnnual = Math.max(0, incomeAfterContribution - professionalExpenseDeductionAnnual);
    var tax = calculateAnnualTax(taxableAnnual);
    var netAnnual = grossAnnual - employeeContributionAnnual - tax.tax;

    return {
      ok: true,
      grossMonthly: grossMonthly,
      grossAnnual: grossAnnual,
      employeeContributionRate: employeeContributionRate,
      employeeContributionMonthly: employeeContributionAnnual / 12,
      employeeContributionAnnual: employeeContributionAnnual,
      incomeAfterContributionAnnual: incomeAfterContribution,
      professionalExpenseRate: STANDARD_PROFESSIONAL_EXPENSE_RATE,
      professionalExpenseDeductionAnnual: professionalExpenseDeductionAnnual,
      taxableAnnual: taxableAnnual,
      taxableMonthlyEquivalent: taxableAnnual / 12,
      incomeTaxAnnual: tax.tax,
      incomeTaxMonthlyEquivalent: tax.tax / 12,
      bands: tax.bands,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      effectiveDeductionRate: grossAnnual ? (employeeContributionAnnual + tax.tax) / grossAnnual : 0
    };
  }

  var engine = {
    id: 'km-paye',
    country: 'KM',
    currency: 'KMF',
    taxBands: TAX_BANDS,
    standardProfessionalExpenseRate: STANDARD_PROFESSIONAL_EXPENSE_RATE,
    maxApprovedEmployeeContributionRate: MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE,
    sourceCheckedOn: '2026-07-22',
    source: {
      title: 'Union of the Comoros Code general des impots 2023',
      url: 'https://www.dgi.gouv.km/file/actes_officiels/Comores-CGI-2023.pdf',
      articles: ['47', '55-60', '97', '104-106'],
      caveat: 'Statutory-reference estimate based on the official 2023 consolidated code. Confirm later amendments and the employee contribution rate applicable to the payslip before relying on the result.'
    },
    formulaParameters: {
      period: 'annual with monthly equivalents',
      currency: 'KMF',
      bands: TAX_BANDS,
      employeeContributionRate: { default: 0, minimum: 0, maximum: MAX_APPROVED_EMPLOYEE_CONTRIBUTION_RATE, source: 'user-supplied approved payslip rate' },
      professionalExpenseDeduction: { rate: STANDARD_PROFESSIONAL_EXPENSE_RATE, base: 'gross employment income after approved pension or social contributions' },
      employerContribution: 'not modeled'
    },
    roundingPolicy: {
      method: 'exact-then-display',
      stages: ['calculate annual employee contribution', 'apply the 30% standard professional-expense deduction', 'apply marginal annual IRPP bands', 'round user-facing KMF totals only']
    },
    calculateAnnualTax: calculateAnnualTax,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.comorosPaye = engine;
  }
}(typeof window !== 'undefined' ? window : globalThis));
