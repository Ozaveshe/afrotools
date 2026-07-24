(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.NEVatEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  'use strict';

  var STANDARD_RATE = 19;
  var TEN_EVIDENCE = 'cgi-2025-art-226-exact-transport-or-hotel-service';
  var FIVE_EVIDENCE = 'cgi-2025-art-226-exact-listed-product';
  var EXEMPT_EVIDENCE = 'lf-2026-art-322-exact-exempt-operation';

  function number(value, label) {
    if (value === '' || value === null || typeof value === 'undefined') throw new RangeError(label + ' is required');
    var result = Number(value);
    if (!Number.isFinite(result) || result < 0) throw new RangeError(label + ' must be non-negative');
    return result;
  }

  function round(value) { return Math.round(value + Number.EPSILON); }

  function resolveTreatment(input) {
    var kind = input.rateKind || 'standard';
    var rules = {
      standard: { rate: 19, treatment: 'taxable-standard', evidence: null },
      'confirmed-reduced-ten': { rate: 10, treatment: 'taxable-reduced', evidence: TEN_EVIDENCE },
      'confirmed-reduced-five': { rate: 5, treatment: 'taxable-reduced', evidence: FIVE_EVIDENCE },
      'confirmed-article-322-exempt': { rate: 0, treatment: 'exempt', evidence: EXEMPT_EVIDENCE }
    };
    var rule = rules[kind];
    if (!rule) throw new RangeError('unsupported Niger VAT treatment');
    if (rule.evidence && (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== rule.evidence)) {
      var error = new RangeError('exact statutory evidence is required');
      error.code = 'RATE_EVIDENCE_REQUIRED';
      throw error;
    }
    return { kind: kind, rate: rule.rate, treatment: rule.treatment };
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
      currency: 'XOF',
      rounding: 'nearest-xof-1',
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
      currency: 'XOF',
      sourceAsOf: '2026-07-23'
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    TEN_EVIDENCE: TEN_EVIDENCE,
    FIVE_EVIDENCE: FIVE_EVIDENCE,
    EXEMPT_EVIDENCE: EXEMPT_EVIDENCE,
    REVIEWED_ON: '2026-07-23',
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    formulaParameters: {
      rates: 'CGI 2025 article 226: 19% standard, 10% exact land transport or hotel accommodation/restaurant service, and 5% exact listed goods',
      exemptions: '2026 Finance Law article 322: no output VAT only for an exact listed exempt operation, including qualifying direct exports',
      filing: 'CGI 2025 articles 254-257: monthly returns, or quarterly for the simplified-real regime, due by the 15th after the period',
      invoice: 'A VAT charge creates liability; taxable suppliers must use compliant certified electronic invoicing and preserve transaction classification',
      rounding: 'nearest XOF 1'
    }
  };
});
