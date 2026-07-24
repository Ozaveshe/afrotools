(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.MUVatEngine = api; }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  var STANDARD_RATE = 15;
  var ZERO_EVIDENCE = 'vat-act-fifth-schedule-exact-zero-rated-supply';
  var EXEMPT_EVIDENCE = 'vat-act-first-schedule-exact-exempt-supply';
  function amount(value) {
    if (value === '' || value === null || typeof value === 'undefined') throw new RangeError('amount is required');
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError('amount must be non-negative');
    return parsed;
  }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function calculate(input) {
    input = input || {};
    var entered = amount(input.amount);
    var kind = input.rateKind || 'standard';
    if (!['standard', 'confirmed-fifth-schedule-zero', 'confirmed-first-schedule-exempt'].includes(kind)) throw new RangeError('unsupported Mauritius VAT treatment');
    var evidence = kind === 'confirmed-fifth-schedule-zero' ? ZERO_EVIDENCE : kind === 'confirmed-first-schedule-exempt' ? EXEMPT_EVIDENCE : null;
    if (evidence && (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== evidence)) {
      var error = new RangeError('exact official evidence is required'); error.code = 'RATE_EVIDENCE_REQUIRED'; throw error;
    }
    var rate = kind === 'standard' ? STANDARD_RATE : 0;
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? entered / (1 + rate / 100) : entered;
    var gross = mode === 'extract' ? entered : net * (1 + rate / 100);
    net = round(net); gross = round(gross);
    return { mode: mode, rateKind: kind, treatment: kind === 'confirmed-first-schedule-exempt' ? 'exempt' : kind === 'confirmed-fifth-schedule-zero' ? 'zero-rated' : 'taxable', rate: rate, net: net, vat: round(gross - net), gross: gross, rounding: 'nearest-mur-0.01', sourceAsOf: '2026-07-22' };
  }
  return { STANDARD_RATE: STANDARD_RATE, ZERO_EVIDENCE: ZERO_EVIDENCE, EXEMPT_EVIDENCE: EXEMPT_EVIDENCE, REVIEWED_ON: '2026-07-22', calculate: calculate,
    formulaParameters: { standard: '15% under VAT Act sections 9-10 and Fourth Schedule', zero: '0% only for an exact Fifth Schedule supply', exemption: 'Only an exact First Schedule exempt supply; exempt is distinct from zero-rated', registration: 'Rs 6,000,000 taxable supplies threshold, subject to Tenth Schedule compulsory-registration rules', filing: 'Monthly above Rs 10,000,000 taxable supplies; quarterly otherwise', invoice: 'VAT Act section 20 VAT invoice requirements', tourism: 'Tourist services are not treated as a generic zero-rated category', rounding: 'nearest MUR 0.01' } };
});
