(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.KEVatEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STANDARD_RATE = 16;
  var WITHHOLDING_RATE = 2;
  var REGISTRATION_THRESHOLD = 5000000;
  var REVIEWED_ON = '2026-07-22';

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function roundMoney(value) {
    return Math.round((finite(value, 0) + Number.EPSILON) * 100) / 100;
  }

  function normalizeAmount(value) {
    var amount = finite(value, NaN);
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError('amount must be a non-negative number');
    return amount;
  }

  function normalizeRate(value) {
    var rate = finite(value, NaN);
    if (!Number.isFinite(rate) || rate < 0 || rate > 100) throw new RangeError('rate must be between 0 and 100');
    return rate;
  }

  function calculate(input) {
    input = input || {};
    var amount = normalizeAmount(input.amount);
    var rate = normalizeRate(input.rate == null ? STANDARD_RATE : input.rate);
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? amount / (1 + rate / 100) : amount;
    var vat = net * rate / 100;
    var gross = mode === 'extract' ? amount : net + vat;
    return {
      mode: mode,
      rate: rate,
      rateKind: input.rateKind === 'scenario' ? 'scenario' : (rate === 0 ? 'zero' : 'standard'),
      net: roundMoney(net),
      vat: roundMoney(vat),
      gross: roundMoney(gross)
    };
  }

  function calculateInvoice(lines, rate, rateKind) {
    if (!Array.isArray(lines) || !lines.length) throw new RangeError('at least one invoice line is required');
    var normalized = lines.map(function (line) {
      var quantity = normalizeAmount(line.quantity);
      var unitPrice = normalizeAmount(line.unitPrice);
      return { description: String(line.description || ''), quantity: quantity, unitPrice: unitPrice, net: roundMoney(quantity * unitPrice) };
    });
    var net = roundMoney(normalized.reduce(function (sum, line) { return sum + line.net; }, 0));
    var result = calculate({ amount: net, rate: rate, rateKind: rateKind, mode: 'add' });
    result.lines = normalized;
    return result;
  }

  function classify(key) {
    if (key === 'standard') return { treatment: 'standard', rate: STANDARD_RATE, source: 'KRA general rate' };
    if (key === 'confirmed-zero') return { treatment: 'zero-rated', rate: 0, source: 'VAT Act Second Schedule' };
    if (key === 'confirmed-exempt') return { treatment: 'exempt', rate: null, source: 'VAT Act First Schedule' };
    return { treatment: 'review', rate: null, source: 'Confirm the exact schedule item with KRA or an adviser' };
  }

  function calculateWithholding(taxableValue, appointedAgentConfirmed) {
    var value = normalizeAmount(taxableValue);
    if (!appointedAgentConfirmed) return { applicable: false, rate: WITHHOLDING_RATE, withheld: 0 };
    return { applicable: true, rate: WITHHOLDING_RATE, withheld: roundMoney(value * WITHHOLDING_RATE / 100) };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    WITHHOLDING_RATE: WITHHOLDING_RATE,
    REGISTRATION_THRESHOLD: REGISTRATION_THRESHOLD,
    REVIEWED_ON: REVIEWED_ON,
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    calculateWithholding: calculateWithholding,
    classify: classify
  };
});
