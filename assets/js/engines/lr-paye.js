(function (root) {
  'use strict';

  var BANDS = [
    { width: 70000, rate: 0 },
    { width: 130000, rate: 0.05 },
    { width: 600000, rate: 0.15 },
    { width: Infinity, rate: 0.25 }
  ];

  function progressiveTax(annualIncome) {
    var remaining = Math.max(0, Number(annualIncome) || 0);
    var tax = 0;
    var floor = 0;
    var detail = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var slice = Math.min(remaining, band.width);
      var bandTax = slice * band.rate;
      detail.push({
        from: floor,
        to: band.width === Infinity ? null : floor + band.width,
        rate: band.rate,
        income: slice,
        tax: bandTax
      });
      tax += bandTax;
      remaining -= slice;
      if (band.width !== Infinity) floor += band.width;
    });
    return { tax: tax, bands: detail };
  }

  function calculate(input) {
    input = input || {};
    var grossAnnual = Number(input.grossAnnual);
    if (!Number.isFinite(grossAnnual) || grossAnnual < 0) {
      return { ok: false, error: 'Enter annual gross salary of zero or more.' };
    }
    var includeNasscorp = input.nasscorp !== false;
    var tax = progressiveTax(grossAnnual);
    var employeeNasscorp = includeNasscorp ? grossAnnual * 0.04 : 0;
    var employerNasscorp = grossAnnual * 0.06;
    var netAnnual = grossAnnual - tax.tax - employeeNasscorp;
    return {
      ok: true,
      grossAnnual: grossAnnual,
      grossMonthly: grossAnnual / 12,
      taxAnnual: tax.tax,
      taxMonthly: tax.tax / 12,
      employeeNasscorpAnnual: employeeNasscorp,
      employeeNasscorpMonthly: employeeNasscorp / 12,
      employerNasscorpAnnual: employerNasscorp,
      employerNasscorpMonthly: employerNasscorp / 12,
      employerCostAnnual: grossAnnual + employerNasscorp,
      employerCostMonthly: (grossAnnual + employerNasscorp) / 12,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      effectiveRate: grossAnnual ? tax.tax / grossAnnual : 0,
      bands: tax.bands
    };
  }

  var engine = {
    bands: BANDS,
    sourceCheckedOn: '2026-07-21',
    formulaParameters: {
      currency: 'LRD',
      period: 'annual',
      employeeNasscorpRate: 0.04,
      employerNasscorpRate: 0.06,
      ssDeductibleFromTaxable: false,
      bands: BANDS
    },
    roundingPolicy: {
      method: 'display-only',
      stages: ['retain exact calculation values', 'round to the nearest LRD for display and export']
    },
    progressiveTax: progressiveTax,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.liberiaPaye = engine;
  }
}(typeof window !== 'undefined' ? window : globalThis));
