(function (root) {
  'use strict';
  var EMPLOYEE_CNSS_RATE = 0.06;
  var EMPLOYER_CNSS_RATE = 0.157;
  var EXEMPTION = 50000;
  var BANDS = [
    { width: 30000, rate: 0.02 },
    { width: 20000, rate: 0.12 },
    { width: 100000, rate: 0.15 },
    { width: 150000, rate: 0.22 },
    { width: 300000, rate: 0.25 },
    { width: 400000, rate: 0.30 },
    { width: 1000000, rate: 0.35 },
    { width: Infinity, rate: 0.45 }
  ];
  var CONTRIBUTION_FLOORS = { professional: 20000, domestic: 15850 };

  function normalizeEmploymentType(value) { return value === 'domestic' ? 'domestic' : 'professional'; }
  function taxMonthly(taxableIncome) {
    var taxable = Math.max(0, Number(taxableIncome) || 0);
    if (taxable <= EXEMPTION) return { tax: 0, bands: [], exempt: true };
    var roundedTaxable = Math.floor(taxable / 5000) * 5000;
    var remaining = roundedTaxable;
    var floor = 0;
    var tax = 0;
    var detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({ from: floor, to: band.width === Infinity ? null : floor + band.width, rate: band.rate, income: slice, tax: bandTax });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) floor += band.width;
    });
    return { tax: tax, bands: detail, exempt: false, roundedTaxable: roundedTaxable };
  }
  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    var employmentType = normalizeEmploymentType(input.employmentType);
    var contributionFloor = CONTRIBUTION_FLOORS[employmentType];
    var contributionBase = grossMonthly > 0 ? Math.max(grossMonthly, contributionFloor) : 0;
    var employeeCnssMonthly = contributionBase * EMPLOYEE_CNSS_RATE;
    var employerCnssMonthly = contributionBase * EMPLOYER_CNSS_RATE;
    var taxableIncome = Math.max(0, grossMonthly - employeeCnssMonthly);
    var tax = taxMonthly(taxableIncome);
    var netMonthly = grossMonthly - employeeCnssMonthly - tax.tax;
    return {
      ok: true, employmentType: employmentType, contributionFloor: contributionFloor, contributionBase: contributionBase,
      grossMonthly: grossMonthly, grossAnnual: grossMonthly * 12,
      employeeCnssMonthly: employeeCnssMonthly, employeeCnssAnnual: employeeCnssMonthly * 12,
      employerCnssMonthly: employerCnssMonthly, employerCnssAnnual: employerCnssMonthly * 12,
      taxableIncome: taxableIncome, roundedTaxableIncome: tax.roundedTaxable == null ? taxableIncome : tax.roundedTaxable, itsMonthly: tax.tax, itsAnnual: tax.tax * 12, exempt: tax.exempt, bands: tax.bands,
      netMonthly: netMonthly, netAnnual: netMonthly * 12,
      employerCostMonthly: grossMonthly + employerCnssMonthly, employerCostAnnual: (grossMonthly + employerCnssMonthly) * 12,
      effectiveDeductionRate: grossMonthly ? (employeeCnssMonthly + tax.tax) / grossMonthly : 0
    };
  }
  var engine = {
    bands: BANDS, exemption: EXEMPTION, employeeCnssRate: EMPLOYEE_CNSS_RATE, employerCnssRate: EMPLOYER_CNSS_RATE,
    contributionFloors: CONTRIBUTION_FLOORS, sourceCheckedOn: '2026-07-22',
    formulaParameters: { period: 'monthly', currency: 'DJF', taxableIncomeExemptionAtOrBelow: EXEMPTION, taxableIncomeStep: 5000, bands: BANDS, employeeCnssRate: EMPLOYEE_CNSS_RATE, employerCnssRate: EMPLOYER_CNSS_RATE, cnssDeductibleFromItsBase: true, contributionFloors: CONTRIBUTION_FLOORS },
    roundingPolicy: { method: 'statutory-floor-then-display', stages: ['floor monthly taxable income to DJF 5,000 under CGI Article 14', 'apply progressive bands', 'round only final user-facing DJF values'] },
    taxMonthly: taxMonthly, calculate: calculate
  };
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.djiboutiPaye = engine; }
}(typeof window !== 'undefined' ? window : globalThis));
