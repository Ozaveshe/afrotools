(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.GHVatEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var VAT_RATE = 15;
  var NHIL_RATE = 2.5;
  var GETFUND_RATE = 2.5;
  var EFFECTIVE_RATE = 20;
  var GOODS_REGISTRATION_THRESHOLD = 750000;
  var EFFECTIVE_FROM = '2026-01-01';
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
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var rateKind = input.rateKind === 'scenario' ? 'scenario' : (input.rateKind === 'zero' ? 'zero' : 'standard');
    var rate = rateKind === 'standard' ? EFFECTIVE_RATE : (rateKind === 'zero' ? 0 : normalizeRate(input.rate));
    var base = mode === 'extract' ? amount / (1 + rate / 100) : amount;
    var vat = rateKind === 'standard' ? base * VAT_RATE / 100 : (rateKind === 'scenario' ? base * rate / 100 : 0);
    var nhil = rateKind === 'standard' ? base * NHIL_RATE / 100 : 0;
    var getfund = rateKind === 'standard' ? base * GETFUND_RATE / 100 : 0;
    var totalTax = vat + nhil + getfund;
    var gross = mode === 'extract' ? amount : base + totalTax;
    return {
      mode: mode,
      rateKind: rateKind,
      effectiveRate: rate,
      base: roundMoney(base),
      vat: roundMoney(vat),
      nhil: roundMoney(nhil),
      getfund: roundMoney(getfund),
      totalTax: roundMoney(totalTax),
      gross: roundMoney(gross)
    };
  }

  function calculateInvoice(lines, input) {
    if (!Array.isArray(lines) || !lines.length) throw new RangeError('at least one invoice line is required');
    var normalized = lines.map(function (line) {
      var quantity = normalizeAmount(line.quantity);
      var unitPrice = normalizeAmount(line.unitPrice);
      return { description: String(line.description || ''), quantity: quantity, unitPrice: unitPrice, base: roundMoney(quantity * unitPrice) };
    });
    var base = roundMoney(normalized.reduce(function (sum, line) { return sum + line.base; }, 0));
    var result = calculate(Object.assign({}, input || {}, { amount: base, mode: 'add' }));
    result.lines = normalized;
    return result;
  }

  function classify(key) {
    if (key === 'standard') return { treatment: 'standard', effectiveRate: EFFECTIVE_RATE, source: 'GRA standard VAT structure under Act 1151' };
    if (key === 'confirmed-zero') return { treatment: 'zero-rated', effectiveRate: 0, source: 'Confirmed zero-rated supply under Act 1151' };
    if (key === 'confirmed-exempt') return { treatment: 'exempt', effectiveRate: null, source: 'Confirmed exempt supply under Act 1151' };
    if (key === 'confirmed-relieved') return { treatment: 'relieved', effectiveRate: null, source: 'Confirmed relieved supply under Act 1151' };
    return { treatment: 'review', effectiveRate: null, source: 'Confirm the exact statutory treatment with GRA' };
  }

  return {
    VAT_RATE: VAT_RATE,
    NHIL_RATE: NHIL_RATE,
    GETFUND_RATE: GETFUND_RATE,
    EFFECTIVE_RATE: EFFECTIVE_RATE,
    GOODS_REGISTRATION_THRESHOLD: GOODS_REGISTRATION_THRESHOLD,
    EFFECTIVE_FROM: EFFECTIVE_FROM,
    REVIEWED_ON: REVIEWED_ON,
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    classify: classify
  };
});
