(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.SNVatEngine = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';
  var STANDARD_RATE = 18;
  var REDUCED_RATE = 10;
  var REDUCED_EVIDENCE = 'cgi-article-369-approved-tourist-establishment-service';
  function number(value, label) {
    if (value === '' || value === null || typeof value === 'undefined') throw new RangeError(label + ' is required');
    var result = Number(value);
    if (!Number.isFinite(result) || result < 0) throw new RangeError(label + ' must be non-negative');
    return result;
  }
  function round(value) { return Math.round(value + Number.EPSILON); }
  function resolveTreatment(input) {
    var kind = input.rateKind || 'standard';
    if (kind === 'standard') {
      if (input.rate !== undefined && Number(input.rate) !== STANDARD_RATE) throw new RangeError('custom Senegal VAT rates are not supported');
      return { kind: kind, rate: STANDARD_RATE, treatment: 'taxable-standard' };
    }
    if (kind !== 'confirmed-approved-tourist-service') throw new RangeError('unsupported Senegal VAT treatment');
    if (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== REDUCED_EVIDENCE) {
      var error = new RangeError('exact Article 369 evidence is required');
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
    net = round(net); gross = round(gross);
    return { mode: mode, rateKind: rule.kind, treatment: rule.treatment, rate: rule.rate, net: net, vat: round(gross - net), gross: gross, currency: 'XOF', rounding: 'nearest-xof-1', sourceAsOf: '2026-07-23' };
  }
  function calculateInvoice(lines) {
    if (!Array.isArray(lines) || !lines.length) throw new RangeError('invoice lines are required');
    var results = lines.map(function(line) {
      var result = calculate({ amount: number(line.quantity, 'quantity') * number(line.unitPrice, 'unit price'), rateKind: line.rateKind, rateEvidenceConfirmed: line.rateEvidenceConfirmed, rateEvidenceType: line.rateEvidenceType });
      return { description: String(line.description || ''), rate: result.rate, treatment: result.treatment, net: result.net, vat: result.vat, gross: result.gross };
    });
    return { lines: results, net: round(results.reduce(function(s, x) { return s + x.net; }, 0)), vat: round(results.reduce(function(s, x) { return s + x.vat; }, 0)), gross: round(results.reduce(function(s, x) { return s + x.gross; }, 0)), currency: 'XOF', sourceAsOf: '2026-07-23' };
  }
  return { STANDARD_RATE: STANDARD_RATE, REDUCED_RATE: REDUCED_RATE, REDUCED_EVIDENCE: REDUCED_EVIDENCE, REVIEWED_ON: '2026-07-23', calculate: calculate, calculateInvoice: calculateInvoice, formulaParameters: { rates: 'CGI Article 369: 18% standard; 10% only for accommodation or restaurant services supplied by an approved tourist accommodation establishment', exclusions: 'Exports, exemptions, registration, regimes, deduction, filing, withholding and invoice compliance are not classified', freshness: 'Official 2026 Finance Law and 2025 rectifying Finance Law checked with no Article 369 rate change found', rounding: 'nearest XOF 1' } };
});
