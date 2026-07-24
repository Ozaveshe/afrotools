(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.gambiaPaye = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var BANDS = [
    { width: 36000, rate: 0 },
    { width: 10000, rate: 0.05 },
    { width: 10000, rate: 0.10 },
    { width: 10000, rate: 0.15 },
    { width: 10000, rate: 0.20 },
    { width: Infinity, rate: 0.25 }
  ];

  function taxAnnual(annualIncome) {
    var remaining = Math.max(0, Number(annualIncome) || 0);
    var from = 0;
    var tax = 0;
    var bands = [];
    BANDS.forEach(function (band) {
      if (remaining <= 0) return;
      var amount = Math.min(remaining, band.width);
      var bandTax = amount * band.rate;
      bands.push({ from: from, to: band.width === Infinity ? from + amount : from + band.width, rate: band.rate, income: amount, tax: bandTax });
      tax += bandTax;
      remaining -= amount;
      if (band.width !== Infinity) from += band.width;
    });
    return { tax: tax, bands: bands };
  }

  function calculate(input) {
    input = input || {};
    var grossAnnual = Number(input.grossAnnual);
    if (!Number.isFinite(grossAnnual) || grossAnnual < 0) {
      return { ok: false, error: 'Enter a gross salary of zero or more.' };
    }
    var scheme = input.scheme === 'FPS' ? 'FPS' : 'NPF';
    var basicAnnual = scheme === 'NPF'
      ? Math.min(grossAnnual, Math.max(0, Number(input.basicAnnual == null ? grossAnnual : input.basicAnnual) || 0))
      : grossAnnual;
    var includeIicf = input.includeIicf !== false;
    var paye = taxAnnual(grossAnnual);
    var employeePension = scheme === 'NPF' ? basicAnnual * 0.05 : 0;
    var employerPension = scheme === 'NPF' ? basicAnnual * 0.10 : grossAnnual * 0.15;
    var iicf = includeIicf ? Math.min(grossAnnual * 0.01, 180) : 0;
    var netAnnual = grossAnnual - employeePension - paye.tax;
    return {
      ok: true,
      scheme: scheme,
      grossAnnual: grossAnnual,
      grossMonthly: grossAnnual / 12,
      basicAnnual: basicAnnual,
      basicMonthly: basicAnnual / 12,
      payeAnnual: paye.tax,
      payeMonthly: paye.tax / 12,
      employeePensionAnnual: employeePension,
      employeePensionMonthly: employeePension / 12,
      employerPensionAnnual: employerPension,
      employerPensionMonthly: employerPension / 12,
      iicfAnnual: iicf,
      iicfMonthly: iicf / 12,
      netAnnual: netAnnual,
      netMonthly: netAnnual / 12,
      employerCostAnnual: grossAnnual + employerPension + iicf,
      employerCostMonthly: (grossAnnual + employerPension + iicf) / 12,
      effectiveTaxRate: paye.tax / grossAnnual,
      bands: paye.bands
    };
  }

  function reverse(input) {
    input = input || {};
    var target = Number(input.netAnnual);
    if (!Number.isFinite(target) || target <= 0) return { ok: false, error: 'Enter a net salary greater than zero.' };
    var low = target;
    var high = target * 3;
    var result;
    for (var index = 0; index < 70; index += 1) {
      var gross = (low + high) / 2;
      var basicRatio = Number.isFinite(Number(input.basicRatio)) ? Math.max(0, Math.min(1, Number(input.basicRatio))) : 1;
      result = calculate({ grossAnnual: gross, basicAnnual: gross * basicRatio, scheme: input.scheme, includeIicf: input.includeIicf });
      if (Math.abs(result.netAnnual - target) < 0.01) return result;
      if (result.netAnnual < target) low = gross; else high = gross;
    }
    return result;
  }

  return {
    bands: BANDS,
    sourceCheckedOn: '2026-07-21',
    calculate: calculate,
    reverse: reverse,
    taxAnnual: taxAnnual
  };
}));
