(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.ZAVatEngine = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STANDARD_RATE = 15;
  var COMPULSORY_THRESHOLD = 2300000;
  var VOLUNTARY_THRESHOLD = 120000;
  var THRESHOLDS_EFFECTIVE = '2026-04-01';
  var REVIEWED_ON = '2026-07-22';

  function finite(value, fallback) { var number = Number(value); return Number.isFinite(number) ? number : fallback; }
  function roundMoney(value) { return Math.round((finite(value, 0) + Number.EPSILON) * 100) / 100; }
  function amount(value) { var number = finite(value, NaN); if (!Number.isFinite(number) || number < 0) throw new RangeError('amount must be a non-negative number'); return number; }
  function rate(value) { var number = finite(value, NaN); if (!Number.isFinite(number) || number < 0 || number > 100) throw new RangeError('rate must be between 0 and 100'); return number; }

  function calculate(input) {
    input = input || {};
    var entered = amount(input.amount);
    var usedRate = rate(input.rate == null ? STANDARD_RATE : input.rate);
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? entered / (1 + usedRate / 100) : entered;
    var vat = net * usedRate / 100;
    var gross = mode === 'extract' ? entered : net + vat;
    return { mode: mode, rate: usedRate, rateKind: input.rateKind === 'scenario' ? 'scenario' : (usedRate === 0 ? 'zero' : 'standard'), net: roundMoney(net), vat: roundMoney(vat), gross: roundMoney(gross) };
  }

  function calculateInvoice(lines, usedRate, rateKind) {
    if (!Array.isArray(lines) || !lines.length) throw new RangeError('at least one invoice line is required');
    var normalized = lines.map(function (line) { var quantity = amount(line.quantity); var unitPrice = amount(line.unitPrice); return { description: String(line.description || ''), quantity: quantity, unitPrice: unitPrice, net: roundMoney(quantity * unitPrice) }; });
    var net = roundMoney(normalized.reduce(function (sum, line) { return sum + line.net; }, 0));
    var result = calculate({ amount: net, rate: usedRate, rateKind: rateKind, mode: 'add' }); result.lines = normalized; return result;
  }

  function classify(key) {
    if (key === 'standard') return { treatment: 'standard', rate: STANDARD_RATE, source: 'VAT Act section 7 and SARS standard-rate guidance' };
    if (key === 'confirmed-zero') return { treatment: 'zero-rated', rate: 0, source: 'Confirmed under VAT Act section 11' };
    if (key === 'confirmed-exempt') return { treatment: 'exempt', rate: null, source: 'Confirmed under VAT Act section 12' };
    return { treatment: 'review', rate: null, source: 'Confirm the exact VAT Act provision with SARS or an adviser' };
  }

  function registrationBand(taxableSupplies) {
    var turnover = amount(taxableSupplies);
    if (turnover > COMPULSORY_THRESHOLD) return 'compulsory-review';
    if (turnover > VOLUNTARY_THRESHOLD) return 'voluntary-range';
    return 'below-voluntary-threshold';
  }

  return { STANDARD_RATE: STANDARD_RATE, COMPULSORY_THRESHOLD: COMPULSORY_THRESHOLD, VOLUNTARY_THRESHOLD: VOLUNTARY_THRESHOLD, THRESHOLDS_EFFECTIVE: THRESHOLDS_EFFECTIVE, REVIEWED_ON: REVIEWED_ON, roundMoney: roundMoney, calculate: calculate, calculateInvoice: calculateInvoice, classify: classify, registrationBand: registrationBand };
});
