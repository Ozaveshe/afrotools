(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.GMVatEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STANDARD_RATE = 15;
  var ZERO_EVIDENCE = 'gra-current-export-of-goods-or-services';

  function amount(value) {
    if (value === '' || value === null || typeof value === 'undefined') throw new RangeError('amount is required');
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0) throw new RangeError('amount must be non-negative');
    return number;
  }

  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    input = input || {};
    var entered = amount(input.amount);
    var kind = input.rateKind || 'standard';
    if (kind !== 'standard' && kind !== 'confirmed-export-zero') throw new RangeError('unsupported Gambia VAT treatment');
    if (kind === 'confirmed-export-zero' && (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== ZERO_EVIDENCE)) {
      var error = new RangeError('exact current export evidence is required');
      error.code = 'RATE_EVIDENCE_REQUIRED';
      throw error;
    }
    var rate = kind === 'standard' ? STANDARD_RATE : 0;
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? entered / (1 + rate / 100) : entered;
    var gross = mode === 'extract' ? entered : net * (1 + rate / 100);
    net = round(net);
    gross = round(gross);
    return {
      mode: mode,
      rateKind: kind,
      rate: rate,
      net: net,
      vat: round(gross - net),
      gross: gross,
      rounding: 'nearest-butut',
      sourceAsOf: '2026-07-22'
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    ZERO_EVIDENCE: ZERO_EVIDENCE,
    REVIEWED_ON: '2026-07-22',
    TREATMENTS: {
      standard: { rate: STANDARD_RATE, evidence: null },
      'confirmed-export-zero': { rate: 0, evidence: ZERO_EVIDENCE }
    },
    formulaParameters: {
      standard: '15%',
      zero: '0% only for exports of goods and services with exact evidence',
      compulsoryThresholdGMD: 2000000,
      voluntaryThresholdGMD: 1000000,
      exemptions: 'Published exemptions are not selectable as zero-rated supplies',
      rounding: 'nearest GMD 0.01 (butut)'
    },
    calculate: calculate
  };
});
