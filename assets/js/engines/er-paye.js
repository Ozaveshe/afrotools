(function (root) {
  'use strict';

  var BANDS = [
    { width: 200, rate: 0.02 },
    { width: 300, rate: 0.07 },
    { width: 700, rate: 0.12 },
    { width: 800, rate: 0.17 },
    { width: 1500, rate: 0.24 },
    { width: 2000, rate: 0.29 },
    { width: 2500, rate: 0.34 },
    { width: Infinity, rate: 0.38 }
  ];
  var PUBLIC_EMPLOYEE_RATE = 0.05;
  var PUBLIC_EMPLOYER_RATE = 0.07;

  function taxMonthly(taxableIncome) {
    var remaining = Math.max(0, Number(taxableIncome) || 0);
    var lower = 0;
    var tax = 0;
    var detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({ from: lower, to: band.width === Infinity ? null : lower + band.width, rate: band.rate, income: slice, tax: bandTax });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) lower += band.width;
    });
    return { tax: tax, bands: detail };
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) return { ok: false, error: 'Enter monthly taxable employment income of zero or more.' };
    var publicSector = input.employmentType === 'public-sector';
    var pensionableBasic = publicSector ? Number(input.pensionableBasic) : 0;
    if (publicSector && (!Number.isFinite(pensionableBasic) || pensionableBasic < 0 || pensionableBasic > grossMonthly)) {
      return { ok: false, error: 'Public-sector pensionable basic salary must be between zero and monthly taxable employment income.' };
    }
    var tax = taxMonthly(grossMonthly);
    var employeePensionMonthly = publicSector ? pensionableBasic * PUBLIC_EMPLOYEE_RATE : 0;
    var employerPensionMonthly = publicSector ? pensionableBasic * PUBLIC_EMPLOYER_RATE : 0;
    var netMonthly = grossMonthly - tax.tax - employeePensionMonthly;
    return {
      ok: true,
      employmentType: publicSector ? 'public-sector' : 'ordinary',
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxableIncome: grossMonthly,
      incomeTaxMonthly: tax.tax,
      incomeTaxAnnual: tax.tax * 12,
      bands: tax.bands,
      pensionableBasic: pensionableBasic,
      employeePensionMonthly: employeePensionMonthly,
      employeePensionAnnual: employeePensionMonthly * 12,
      employerPensionMonthly: employerPensionMonthly,
      employerPensionAnnual: employerPensionMonthly * 12,
      netMonthly: netMonthly,
      netAnnual: netMonthly * 12,
      employerCostMonthly: grossMonthly + employerPensionMonthly,
      employerCostAnnual: (grossMonthly + employerPensionMonthly) * 12,
      effectiveDeductionRate: grossMonthly ? (tax.tax + employeePensionMonthly) / grossMonthly : 0
    };
  }

  var engine = {
    bands: BANDS,
    publicEmployeePensionRate: PUBLIC_EMPLOYEE_RATE,
    publicEmployerPensionRate: PUBLIC_EMPLOYER_RATE,
    sourceCheckedOn: '2026-07-22',
    formulaParameters: {
      period: 'monthly', currency: 'ERN', bands: BANDS,
      publicSectorPension: { employeeRate: PUBLIC_EMPLOYEE_RATE, employerRate: PUBLIC_EMPLOYER_RATE, base: 'user-entered monthly pensionable basic salary' },
      pensionDeductibleFromTaxBase: false
    },
    roundingPolicy: { method: 'exact-then-display', stages: ['apply marginal monthly bands to taxable employment income', 'calculate any public-sector pension separately', 'round user-facing ERN totals only'] },
    taxMonthly: taxMonthly,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.eritreaPaye = engine; }
}(typeof window !== 'undefined' ? window : globalThis));
