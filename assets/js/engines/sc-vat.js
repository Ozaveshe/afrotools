(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.SCVatEngine = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  var STANDARD_RATE = 15;
  var COMPULSORY_THRESHOLD = 2000000;
  var VOLUNTARY_THRESHOLD = 100000;
  var ZERO_EVIDENCE = 'vat-act-current-second-schedule-zero-rated-supply';
  var EXEMPT_EVIDENCE = 'vat-act-current-first-schedule-exempt-supply';
  function number(value, label) {
    if (value === '' || value === null || typeof value === 'undefined') throw new RangeError(label + ' is required');
    var result = Number(value);
    if (!Number.isFinite(result) || result < 0) throw new RangeError(label + ' must be non-negative');
    return result;
  }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function resolveTreatment(input) {
    var kind = input.rateKind || 'standard';
    if (kind === 'standard') {
      if (input.rate !== undefined && Number(input.rate) !== STANDARD_RATE) throw new RangeError('custom Seychelles VAT rates are not supported');
      return { kind: kind, rate: STANDARD_RATE, treatment: 'taxable-standard' };
    }
    var evidence = kind === 'confirmed-zero-rated' ? ZERO_EVIDENCE : kind === 'confirmed-exempt' ? EXEMPT_EVIDENCE : null;
    if (!evidence) throw new RangeError('unsupported Seychelles VAT treatment');
    if (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== evidence) {
      var error = new RangeError('exact current Schedule evidence is required');
      error.code = 'RATE_EVIDENCE_REQUIRED';
      throw error;
    }
    return { kind: kind, rate: 0, treatment: kind === 'confirmed-zero-rated' ? 'zero-rated' : 'exempt' };
  }
  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, 'amount');
    var rule = resolveTreatment(input);
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? entered / (1 + rule.rate / 100) : entered;
    var gross = mode === 'extract' ? entered : net * (1 + rule.rate / 100);
    net = round(net); gross = round(gross);
    return { mode: mode, rateKind: rule.kind, treatment: rule.treatment, rate: rule.rate, net: net, vat: round(gross - net), gross: gross, currency: 'SCR', rounding: 'nearest-scr-0.01', sourceAsOf: '2026-07-23' };
  }
  function calculateInvoice(lines) {
    if (!Array.isArray(lines) || !lines.length) throw new RangeError('invoice lines are required');
    var results = lines.map(function(line) {
      var result = calculate({ amount: number(line.quantity, 'quantity') * number(line.unitPrice, 'unit price'), rateKind: line.rateKind, rateEvidenceConfirmed: line.rateEvidenceConfirmed, rateEvidenceType: line.rateEvidenceType });
      return { description: String(line.description || ''), rate: result.rate, treatment: result.treatment, net: result.net, vat: result.vat, gross: result.gross };
    });
    return { lines: results, net: round(results.reduce(function(sum, item) { return sum + item.net; }, 0)), vat: round(results.reduce(function(sum, item) { return sum + item.vat; }, 0)), gross: round(results.reduce(function(sum, item) { return sum + item.gross; }, 0)), currency: 'SCR', sourceAsOf: '2026-07-23' };
  }
  function assessRegistration(input) {
    input = input || {};
    var pastTwelveMonths = number(input.pastTwelveMonths || 0, 'past twelve months');
    var expectedNextTwelveMonths = number(input.expectedNextTwelveMonths || 0, 'expected next twelve months');
    var expectedNextSixMonths = number(input.expectedNextSixMonths || 0, 'expected next six months');
    var compulsory = pastTwelveMonths >= COMPULSORY_THRESHOLD || expectedNextTwelveMonths >= COMPULSORY_THRESHOLD;
    var voluntaryEligible = !compulsory && (pastTwelveMonths >= VOLUNTARY_THRESHOLD || expectedNextSixMonths >= VOLUNTARY_THRESHOLD);
    return {
      status: compulsory ? 'compulsory-threshold-met' : voluntaryEligible ? 'voluntary-threshold-met' : 'below-modeled-thresholds',
      compulsory: compulsory,
      voluntaryEligible: voluntaryEligible,
      compulsoryThreshold: COMPULSORY_THRESHOLD,
      voluntaryThreshold: VOLUNTARY_THRESHOLD,
      commissionerDecisionRequired: !compulsory && voluntaryEligible,
      sourceAsOf: '2026-07-23'
    };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    COMPULSORY_THRESHOLD: COMPULSORY_THRESHOLD,
    VOLUNTARY_THRESHOLD: VOLUNTARY_THRESHOLD,
    ZERO_EVIDENCE: ZERO_EVIDENCE,
    EXEMPT_EVIDENCE: EXEMPT_EVIDENCE,
    REVIEWED_ON: '2026-07-23',
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    assessRegistration: assessRegistration,
    formulaParameters: {
      rate: 'Third Schedule and current SRC material: 15% standard',
      specialTreatments: '0% only with exact current Second Schedule evidence; exempt only with exact current First Schedule evidence',
      registration: 'Fourth Schedule from 2025: SCR 2,000,000 compulsory and SCR 100,000 voluntary eligibility',
      exclusions: 'No broad classification, automatic registration approval, filing, deduction, refund or invoice-compliance decision',
      rounding: 'nearest SCR 0.01'
    }
  };
});
