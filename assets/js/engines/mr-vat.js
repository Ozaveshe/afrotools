(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.MRVatEngine = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var STANDARD_RATE = 16;
  var TELEPHONY_EVIDENCE = 'lfr-2023-article-230-telephony-supply';
  var EXPORT_EVIDENCE = 'cgi-article-230-export-by-vat-taxpayer';
  var EXEMPT_EVIDENCE = 'cgi-article-215-exact-exemption-item';

  function parseAmount(value) {
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
    var entered = parseAmount(input.amount);
    var kind = input.rateKind || 'standard';
    var supported = ['standard', 'confirmed-telephony', 'confirmed-export-zero', 'confirmed-article-215-exempt'];
    if (!supported.includes(kind)) throw new RangeError('unsupported Mauritania VAT treatment');

    var evidence = kind === 'confirmed-telephony'
      ? TELEPHONY_EVIDENCE
      : kind === 'confirmed-export-zero'
        ? EXPORT_EVIDENCE
        : kind === 'confirmed-article-215-exempt'
          ? EXEMPT_EVIDENCE
          : null;
    if (evidence && (input.rateEvidenceConfirmed !== true || input.rateEvidenceType !== evidence)) {
      var error = new RangeError('exact official evidence is required');
      error.code = 'RATE_EVIDENCE_REQUIRED';
      throw error;
    }

    var rate = kind === 'standard' ? 16 : kind === 'confirmed-telephony' ? 18 : 0;
    var mode = input.mode === 'extract' ? 'extract' : 'add';
    var net = mode === 'extract' ? entered / (1 + rate / 100) : entered;
    var gross = mode === 'extract' ? entered : net * (1 + rate / 100);
    net = round(net);
    gross = round(gross);
    return {
      mode: mode,
      rateKind: kind,
      treatment: kind === 'confirmed-article-215-exempt' ? 'exempt' : kind === 'confirmed-export-zero' ? 'zero-rated' : 'taxable',
      rate: rate,
      net: net,
      vat: round(gross - net),
      gross: gross,
      rounding: 'nearest-mru-0.01',
      sourceAsOf: '2026-07-22'
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    TELEPHONY_EVIDENCE: TELEPHONY_EVIDENCE,
    EXPORT_EVIDENCE: EXPORT_EVIDENCE,
    EXEMPT_EVIDENCE: EXEMPT_EVIDENCE,
    REVIEWED_ON: '2026-07-22',
    calculate: calculate,
    formulaParameters: {
      standard: '16% normal rate under CGI Article 230',
      telephony: '18% for telephony under LFR 2023 Article 3.1 amending CGI Article 230',
      export: '0% only for exports of goods or services by a VAT-taxable person under CGI Article 230',
      exemption: 'Article 215 treatment requires an exact listed provision and is exempt, not zero-rated',
      registration: 'CGI Article 211: annual turnover excluding tax at least MRU 3,000,000; importers regardless of turnover',
      filing: 'CGI Articles 249-250: monthly return due by the 15th of the following month',
      rounding: 'nearest MRU 0.01'
    }
  };
});
