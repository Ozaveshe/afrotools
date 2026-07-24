(function (root) {
  'use strict';

  var BANDS = [
    { width: 100, rate: 0 },
    { width: 400, rate: 0.06 },
    { width: 1000, rate: 0.12 },
    { width: Infinity, rate: 0.18 }
  ];

  function progressiveTax(income) {
    var remaining = Math.max(0, Number(income) || 0);
    var tax = 0;
    var floor = 0;
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
    return { tax: tax, bands: detail };
  }

  function normalizeCategory(value) {
    return value === 'nonresident' || value === 'resident-under-18' ? value : 'resident-adult';
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter monthly chargeable employment income of zero or more.' };
    }
    var category = normalizeCategory(input.category);
    var progressive = progressiveTax(grossMonthly);
    var taxMonthly = category === 'nonresident'
      ? grossMonthly * 0.18
      : category === 'resident-under-18'
        ? grossMonthly * 0.20
        : progressive.tax;
    var netMonthly = grossMonthly - taxMonthly;
    return {
      ok: true,
      category: category,
      grossMonthly: grossMonthly,
      grossAnnual: grossMonthly * 12,
      taxMonthly: taxMonthly,
      taxAnnual: taxMonthly * 12,
      netMonthly: netMonthly,
      netAnnual: netMonthly * 12,
      effectiveRate: grossMonthly ? taxMonthly / grossMonthly : 0,
      bands: category === 'resident-adult' ? progressive.bands : []
    };
  }

  var engine = {
    bands: BANDS,
    sourceCheckedOn: '2026-07-22',
    lawEffectiveOn: '2025-05-11',
    formulaParameters: {
      currency: 'USD',
      period: 'monthly',
      residentAdultBands: BANDS,
      nonresidentRate: 0.18,
      residentUnder18Rate: 0.20,
      employmentDeductionsAllowed: false,
      scope: 'Federal Republic of Somalia income tax only'
    },
    roundingPolicy: { method: 'display-only', stages: ['retain exact calculation values', 'round to cents for display'] },
    progressiveTax: progressiveTax,
    calculate: calculate
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.somaliaPaye = engine;
  }
}(typeof window !== 'undefined' ? window : globalThis));
