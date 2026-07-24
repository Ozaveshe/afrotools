(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.STVatEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var STANDARD_RATE = 15;
  var REDUCED_RATE = 7.5;
  var REDUCED_EVIDENCE = 'civa-2023-annex-1-exact-basic-basket-line';

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
      if (input.rate !== undefined && Number(input.rate) !== STANDARD_RATE) throw new RangeError('custom Sao Tome VAT rates are not supported');
      return { kind: kind, rate: STANDARD_RATE, treatment: 'taxable-standard' };
    }
    if (kind !== 'confirmed-annex-1-reduced') throw new RangeError('unsupported Sao Tome VAT treatment');
    if (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== REDUCED_EVIDENCE) {
      var error = new RangeError('exact Annex I evidence is required');
      error.code = 'RATE_EVIDENCE_REQUIRED';
      throw error;
    }
    return { kind: kind, rate: REDUCED_RATE, treatment: 'taxable-reduced' };
  }

  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, 'amount');
    var rule = resolveTreatment(input);
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? entered / (1 + rule.rate / 100) : entered;
    var gross = mode === 'extract' ? entered : net * (1 + rule.rate / 100);
    net = round(net);
    gross = round(gross);
    return {
      mode: mode,
      rateKind: rule.kind,
      treatment: rule.treatment,
      rate: rule.rate,
      net: net,
      vat: round(gross - net),
      gross: gross,
      currency: 'STN',
      rounding: 'nearest-stn-0.01',
      sourceAsOf: '2026-07-23'
    };
  }

  function calculateInvoice(lines) {
    if (!Array.isArray(lines) || !lines.length) throw new RangeError('invoice lines are required');
    var results = lines.map(function(line) {
      var quantity = number(line.quantity, 'quantity');
      var unitPrice = number(line.unitPrice, 'unit price');
      var result = calculate({
        amount: quantity * unitPrice,
        rateKind: line.rateKind,
        rateEvidenceConfirmed: line.rateEvidenceConfirmed,
        rateEvidenceType: line.rateEvidenceType
      });
      return { description: String(line.description || ''), quantity: quantity, unitPrice: unitPrice, rate: result.rate, treatment: result.treatment, net: result.net, vat: result.vat, gross: result.gross };
    });
    return {
      lines: results,
      net: round(results.reduce(function(sum, line) { return sum + line.net; }, 0)),
      vat: round(results.reduce(function(sum, line) { return sum + line.vat; }, 0)),
      gross: round(results.reduce(function(sum, line) { return sum + line.gross; }, 0)),
      currency: 'STN',
      sourceAsOf: '2026-07-23'
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    REDUCED_RATE: REDUCED_RATE,
    REDUCED_EVIDENCE: REDUCED_EVIDENCE,
    REVIEWED_ON: '2026-07-23',
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    formulaParameters: {
      rates: 'CIVA as amended in 2023: 15% standard and 7.5% only for an exact Annex I basic-basket line',
      exclusions: 'No generic exemption, zero rate, registration, deduction, filing or invoice classification is modeled',
      unresolved: 'The official IVA manual second edition contains an explicitly illustrative 2025 example using 16%; no primary enactment changing the rate to 16% was found as checked 2026-07-23',
      rounding: 'nearest STN 0.01'
    }
  };
});
