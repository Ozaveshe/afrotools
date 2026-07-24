(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.SLGstEngine = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  var STANDARD_RATE = 15;
  var REGISTRATION_THRESHOLD = 500000;
  var FOUR_MONTH_THRESHOLD = REGISTRATION_THRESHOLD / 3;
  var ZERO_EVIDENCE = 'gst-act-current-first-schedule-zero-rated-supply';
  var EXEMPT_EVIDENCE = 'gst-act-current-second-schedule-exempt-supply';

  function number(value, label) {
    if (value === '' || value === null || typeof value === 'undefined') throw new RangeError(label + ' is required');
    var result = Number(value);
    if (!Number.isFinite(result) || result < 0) throw new RangeError(label + ' must be non-negative');
    return result;
  }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function assertCurrency(currency) {
    if (currency && String(currency).toUpperCase() !== 'SLE') {
      var error = new RangeError('Sierra Leone GST uses SLE (new leone / NLe); stale SLL values are not accepted');
      error.code = 'STALE_CURRENCY';
      throw error;
    }
  }
  function resolveTreatment(input) {
    var kind = input.rateKind || 'standard';
    if (kind === 'standard') {
      if (input.rate !== undefined && Number(input.rate) !== STANDARD_RATE) throw new RangeError('custom Sierra Leone GST rates are not supported');
      return { kind: kind, rate: STANDARD_RATE, treatment: 'taxable-standard' };
    }
    var evidence = kind === 'confirmed-zero-rated' ? ZERO_EVIDENCE : kind === 'confirmed-exempt' ? EXEMPT_EVIDENCE : null;
    if (!evidence) throw new RangeError('unsupported Sierra Leone GST treatment');
    if (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== evidence) {
      var error = new RangeError('exact current Schedule evidence is required');
      error.code = 'RATE_EVIDENCE_REQUIRED';
      throw error;
    }
    return { kind: kind, rate: 0, treatment: kind === 'confirmed-zero-rated' ? 'zero-rated' : 'exempt' };
  }
  function calculate(input) {
    input = input || {};
    assertCurrency(input.currency);
    var entered = number(input.amount, 'amount');
    var rule = resolveTreatment(input);
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? entered / (1 + rule.rate / 100) : entered;
    var gross = mode === 'extract' ? entered : net * (1 + rule.rate / 100);
    net = round(net); gross = round(gross);
    return { mode: mode, rateKind: rule.kind, treatment: rule.treatment, rate: rule.rate, net: net, gst: round(gross - net), gross: gross, currency: 'SLE', rounding: 'nearest-sle-0.01', sourceAsOf: '2026-07-23' };
  }
  function calculateInvoice(lines, currency) {
    assertCurrency(currency);
    if (!Array.isArray(lines) || !lines.length) throw new RangeError('invoice lines are required');
    var results = lines.map(function(line) {
      var result = calculate({ amount: number(line.quantity, 'quantity') * number(line.unitPrice, 'unit price'), currency: 'SLE', rateKind: line.rateKind, rateEvidenceConfirmed: line.rateEvidenceConfirmed, rateEvidenceType: line.rateEvidenceType });
      return { description: String(line.description || ''), rate: result.rate, treatment: result.treatment, net: result.net, gst: result.gst, gross: result.gross };
    });
    return { lines: results, net: round(results.reduce(function(sum, item) { return sum + item.net; }, 0)), gst: round(results.reduce(function(sum, item) { return sum + item.gst; }, 0)), gross: round(results.reduce(function(sum, item) { return sum + item.gross; }, 0)), currency: 'SLE', sourceAsOf: '2026-07-23' };
  }
  function assessRegistration(input) {
    input = input || {};
    assertCurrency(input.currency);
    var pastTwelveMonths = number(input.pastTwelveMonths || 0, 'past twelve months');
    var expectedNextTwelveMonths = number(input.expectedNextTwelveMonths || 0, 'expected next twelve months');
    var pastFourMonths = number(input.pastFourMonths || 0, 'past four months');
    var compulsory = pastTwelveMonths >= REGISTRATION_THRESHOLD
      || expectedNextTwelveMonths >= REGISTRATION_THRESHOLD
      || pastFourMonths >= FOUR_MONTH_THRESHOLD;
    return {
      status: compulsory ? 'compulsory-threshold-met' : 'below-compulsory-voluntary-application-possible',
      compulsory: compulsory,
      voluntaryApplicationPossible: !compulsory,
      commissionerDecisionRequired: !compulsory,
      registrationThreshold: REGISTRATION_THRESHOLD,
      fourMonthThreshold: FOUR_MONTH_THRESHOLD,
      sourceAsOf: '2026-07-23'
    };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    REGISTRATION_THRESHOLD: REGISTRATION_THRESHOLD,
    FOUR_MONTH_THRESHOLD: FOUR_MONTH_THRESHOLD,
    ZERO_EVIDENCE: ZERO_EVIDENCE,
    EXEMPT_EVIDENCE: EXEMPT_EVIDENCE,
    REVIEWED_ON: '2026-07-23',
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    assessRegistration: assessRegistration,
    formulaParameters: {
      rate: 'GST Act section 14: 15% unless an exact First Schedule zero-rated supply applies',
      specialTreatments: '0% only with exact current First Schedule evidence; exempt only with exact current Second Schedule evidence',
      registration: 'GST Act section 15 as amended by Finance Act 2024: NLe 500,000 in past 12 months or expected next 12 months, or one third in past 4 months',
      exclusions: 'No broad classification, automatic voluntary registration, filing, deduction, refund or invoice-compliance decision',
      rounding: 'nearest SLE 0.01'
    }
  };
});
