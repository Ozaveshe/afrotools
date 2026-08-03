(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ugandaPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_NSSF_RATE = 0.05;
  var EMPLOYER_NSSF_RATE = 0.10;
  var HIGH_INCOME_THRESHOLD = 10000000;
  var HIGH_INCOME_SUPPLEMENT_RATE = 0.10;
  var RESIDENT = 'RESIDENT';
  var NON_RESIDENT = 'NON_RESIDENT';
  var LST_BANDS = [
    { upTo: 100000, annual: 0 }, { upTo: 200000, annual: 5000 },
    { upTo: 300000, annual: 10000 }, { upTo: 400000, annual: 20000 },
    { upTo: 500000, annual: 30000 }, { upTo: 600000, annual: 40000 },
    { upTo: 700000, annual: 60000 }, { upTo: 800000, annual: 70000 },
    { upTo: 900000, annual: 80000 }, { upTo: 1000000, annual: 90000 },
    { upTo: Infinity, annual: 100000 }
  ];

  function finiteNonNegative(value, label) {
    var number = Number(value);
    return Number.isFinite(number) && number >= 0
      ? { ok: true, value: number }
      : { ok: false, error: 'Enter a valid ' + label + ' of zero or more.' };
  }
  function normalizeRegime(value) {
    return String(value || '').toUpperCase().replace(/[-\s]/g, '_') === NON_RESIDENT ? NON_RESIDENT : RESIDENT;
  }
  function residentTax(value) {
    var income = Math.max(0, Number(value) || 0);
    var tax = income > 410000 ? 25000 + (income - 410000) * 0.30
      : income > 335000 ? 10000 + (income - 335000) * 0.20
        : income > 235000 ? (income - 235000) * 0.10 : 0;
    if (income > HIGH_INCOME_THRESHOLD) tax += (income - HIGH_INCOME_THRESHOLD) * HIGH_INCOME_SUPPLEMENT_RATE;
    return tax;
  }
  function nonResidentTax(value) {
    var income = Math.max(0, Number(value) || 0);
    var tax = income > 410000 ? 48500 + (income - 410000) * 0.30
      : income > 335000 ? 33500 + (income - 335000) * 0.20 : income * 0.10;
    if (income > HIGH_INCOME_THRESHOLD) tax += (income - HIGH_INCOME_THRESHOLD) * HIGH_INCOME_SUPPLEMENT_RATE;
    return tax;
  }
  function bandBreakdown(value, regime) {
    var income = Math.max(0, Number(value) || 0);
    var bands = normalizeRegime(regime) === NON_RESIDENT
      ? [{ from: 0, to: 335000, rate: 0.10 }, { from: 335000, to: 410000, rate: 0.20 }, { from: 410000, to: HIGH_INCOME_THRESHOLD, rate: 0.30 }, { from: HIGH_INCOME_THRESHOLD, to: null, rate: 0.40 }]
      : [{ from: 0, to: 235000, rate: 0 }, { from: 235000, to: 335000, rate: 0.10 }, { from: 335000, to: 410000, rate: 0.20 }, { from: 410000, to: HIGH_INCOME_THRESHOLD, rate: 0.30 }, { from: HIGH_INCOME_THRESHOLD, to: null, rate: 0.40 }];
    return bands.map(function (band) {
      var upper = band.to == null ? income : Math.min(income, band.to);
      var bandIncome = Math.max(0, upper - band.from);
      return { from: band.from, to: band.to, rate: band.rate, income: bandIncome, tax: bandIncome * band.rate };
    }).filter(function (band) { return band.income > 0 || (income === 0 && band.from === 0); });
  }
  function taxMonthly(taxableIncome, regime) {
    var checked = finiteNonNegative(taxableIncome, 'monthly taxable income');
    if (!checked.ok) return checked;
    var normalized = normalizeRegime(regime);
    return { ok: true, regime: normalized, taxableIncome: checked.value, tax: normalized === NON_RESIDENT ? nonResidentTax(checked.value) : residentTax(checked.value), bands: bandBreakdown(checked.value, normalized) };
  }
  function lstFromGross(monthlyGross) {
    var gross = Math.max(0, Number(monthlyGross) || 0);
    for (var index = 0; index < LST_BANDS.length; index += 1) if (gross <= LST_BANDS[index].upTo) return LST_BANDS[index].annual;
    return 0;
  }
  function resolveLst(monthlyGross, regime) {
    var checked = finiteNonNegative(monthlyGross, 'monthly gross salary');
    if (!checked.ok) return checked;
    var gross = checked.value;
    var normalized = normalizeRegime(regime);
    var annual = lstFromGross(gross);
    var paye = taxMonthly(Math.max(0, gross - annual), normalized).tax;
    return { ok: true, annual: annual, assessmentGross: gross, payeAfterFullLstDeduction: paye };
  }
  function annualLst(monthlyGross, regime) {
    var resolved = resolveLst(monthlyGross, regime);
    return resolved.ok ? resolved.annual : NaN;
  }
  function collectionSchedule(annual, currentDeduction) {
    if (annual <= 0) return [];
    if (currentDeduction >= annual) return [annual];
    if (currentDeduction <= 0) return [0, annual];
    return [currentDeduction, annual - currentDeduction];
  }
  function calculate(input) {
    input = input || {};
    var checked = finiteNonNegative(input.grossMonthly, 'monthly gross salary');
    if (!checked.ok) return checked;
    var grossMonthly = checked.value;
    var regime = normalizeRegime(input.regime);
    var hasLst = input.lstEnabled === true;
    var hasNssf = input.nssfEnabled !== false;
    var resolvedLst = hasLst ? resolveLst(grossMonthly, regime) : { ok: true, annual: 0, assessmentGross: grossMonthly, payeAfterFullLstDeduction: taxMonthly(grossMonthly, regime).tax };
    if (!resolvedLst.ok) return resolvedLst;
    var lstAnnual = resolvedLst.annual;
    var requestedLst = input.lstPayrollDeduction == null ? lstAnnual : Number(input.lstPayrollDeduction);
    if (!Number.isFinite(requestedLst) || requestedLst < 0 || requestedLst > grossMonthly || requestedLst > lstAnnual) return { ok: false, error: 'LST payroll deduction must be between zero and the annual LST amount and cannot exceed gross salary.' };
    var lstPayrollDeduction = hasLst ? requestedLst : 0;
    var taxableIncome = grossMonthly - lstPayrollDeduction;
    var paye = taxMonthly(taxableIncome, regime);
    var regularPaye = taxMonthly(grossMonthly, regime);
    var employeeNssfMonthly = hasNssf ? grossMonthly * EMPLOYEE_NSSF_RATE : 0;
    var employerNssfMonthly = hasNssf ? grossMonthly * EMPLOYER_NSSF_RATE : 0;
    var lstCollectionSchedule = hasLst ? collectionSchedule(lstAnnual, lstPayrollDeduction) : [];
    var annualPaye = hasLst
      ? lstCollectionSchedule.reduce(function (total, deduction) { return total + taxMonthly(grossMonthly - deduction, regime).tax; }, 0)
        + regularPaye.tax * (12 - lstCollectionSchedule.length)
      : paye.tax * 12;
    return {
      ok: true, regime: regime, grossMonthly: grossMonthly, grossAnnual: grossMonthly * 12,
      taxableIncome: taxableIncome, lstEnabled: hasLst, lstAnnual: lstAnnual, lstPayrollDeduction: lstPayrollDeduction,
      lstCollectionSchedule: lstCollectionSchedule, lstAssessmentGross: resolvedLst.assessmentGross,
      employeeNssfMonthly: employeeNssfMonthly, employeeNssfAnnual: employeeNssfMonthly * 12,
      employerNssfMonthly: employerNssfMonthly, employerNssfAnnual: employerNssfMonthly * 12,
      monthlyPaye: paye.tax, annualPaye: annualPaye, bands: paye.bands,
      netMonthly: grossMonthly - lstPayrollDeduction - paye.tax - employeeNssfMonthly,
      netAnnual: grossMonthly * 12 - annualPaye - employeeNssfMonthly * 12 - lstAnnual,
      employerCostMonthly: grossMonthly + employerNssfMonthly,
      employerCostAnnual: (grossMonthly + employerNssfMonthly) * 12,
      effectiveTaxRate: grossMonthly ? paye.tax / grossMonthly : 0,
      effectiveDeductionRate: grossMonthly ? (paye.tax + employeeNssfMonthly + lstPayrollDeduction) / grossMonthly : 0
    };
  }
  return {
    country: 'UG', currency: 'UGX', lastUpdated: '2026-08-02',
    regimes: [RESIDENT, NON_RESIDENT], residentRegime: RESIDENT, nonResidentRegime: NON_RESIDENT,
    employeeNssfRate: EMPLOYEE_NSSF_RATE, employerNssfRate: EMPLOYER_NSSF_RATE,
    highIncomeThreshold: HIGH_INCOME_THRESHOLD, highIncomeSupplementRate: HIGH_INCOME_SUPPLEMENT_RATE,
    lstBands: LST_BANDS, sourceCheckedOn: '2026-08-02', effectiveDateStatus: 'current-law-confirmed',
    formulaParameters: { method: 'monthly-employment-income-with-gross-salary-lst-assessment-before-paye-and-before-nssf', regimes: [RESIDENT, NON_RESIDENT], residentThresholds: [235000, 335000, 410000, HIGH_INCOME_THRESHOLD], nonResidentThresholds: [335000, 410000, HIGH_INCOME_THRESHOLD], highIncomeSupplementRate: HIGH_INCOME_SUPPLEMENT_RATE, employeeNssfRate: EMPLOYEE_NSSF_RATE, employerNssfRate: EMPLOYER_NSSF_RATE, nssfDeductibleFromPayeBase: false, lstAssessmentBase: 'monthly gross salary as defined by the KCCA guidance', lstDeductedBeforePaye: true, lstCollectionInstallmentsMaximum: 4, lstBands: LST_BANDS },
    roundingPolicy: { method: 'display-only', stages: ['retain exact statutory calculation values', 'round only for displayed UGX and exported rows'] },
    normalizeRegime: normalizeRegime, taxMonthly: taxMonthly, lstFromGross: lstFromGross,
    resolveLst: resolveLst, annualLst: annualLst, calculate: calculate
  };
}));
