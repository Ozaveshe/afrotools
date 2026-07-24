(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.CIVatEngine = api; }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 18;
  var REDUCED_RATE = 9;
  var MICRO_UPPER_BOUND = 200000000;
  var RSI_UPPER_BOUND = 500000000;
  var REVIEWED_ON = "2026-07-22";
  var TREATMENTS = {
    standard: { rate: 18, evidenceType: null },
    "article-359-reduced-confirmed": { rate: 9, evidenceType: "cgi-article-359-item" },
    "ordinance-2026-reduced-confirmed": { rate: 9, evidenceType: "ordinance-2026-03-item" },
    "article-355-exempt-confirmed": { rate: 0, evidenceType: "cgi-article-355-item" },
  };
  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined") throw new RangeError(label + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(label + " must be a non-negative number");
    return parsed;
  }
  function roundMoney(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function resolveTreatment(kind) {
    var key = kind || "standard";
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, key)) throw new RangeError("unsupported VAT treatment");
    return TREATMENTS[key];
  }
  function requireEvidence(kind, confirmed, evidenceType) {
    var treatment = resolveTreatment(kind);
    if (treatment.evidenceType && (confirmed !== true || evidenceType !== treatment.evidenceType)) {
      var error = new RangeError("exact Côte d'Ivoire VAT evidence must be confirmed");
      error.code = "RATE_EVIDENCE_REQUIRED";
      throw error;
    }
  }
  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount");
    var mode = input.mode === "extract" ? "extract" : "add";
    var rateKind = input.rateKind || "standard";
    var treatment = resolveTreatment(rateKind);
    requireEvidence(rateKind, input.rateEvidenceConfirmed, input.rateEvidenceType);
    var net = mode === "extract" ? entered / (1 + treatment.rate / 100) : entered;
    var vat = net * treatment.rate / 100;
    return { mode: mode, rateKind: rateKind, rate: treatment.rate, net: roundMoney(net), vat: roundMoney(vat), gross: roundMoney(net + vat) };
  }
  function regimeScreen(turnover) {
    var amount = number(turnover, "annual turnover");
    return {
      status: amount <= MICRO_UPPER_BOUND ? "micro-review" : amount <= RSI_UPPER_BOUND ? "rsi-review" : "rni-review",
      determinesVatLiability: false,
    };
  }
  function classify(key) {
    if (Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      return { treatment: key === "standard" ? "standard" : "confirmed", rate: TREATMENTS[key].rate,
        note: key === "standard" ? "The DGI states the common VAT rate is 18% on the tax-exclusive base." : "Use only after matching the exact current CGI article or 2026 ordinance item." };
    }
    return { treatment: "review", rate: null, note: "Do not infer reduced or exempt treatment from a broad product label. Confirm the exact current provision." };
  }
  return {
    STANDARD_RATE: STANDARD_RATE, REDUCED_RATE: REDUCED_RATE, MICRO_UPPER_BOUND: MICRO_UPPER_BOUND,
    RSI_UPPER_BOUND: RSI_UPPER_BOUND, REVIEWED_ON: REVIEWED_ON, TREATMENTS: TREATMENTS,
    formulaParameters: {
      standard: "CGI Articles 339 and following: common VAT rate 18% on the tax-exclusive base",
      reduced: "9% only for an exact current Article 359 item or an Ordinance 2026-03 item, effective 17 January 2026",
      exemption: "0 tax in this calculator only after confirming the exact current Article 355 exemption; exemption is not described as zero-rating",
      regimes: "The micro, real simplified and real normal turnover bands are a regime screen, not a universal VAT registration threshold",
    },
    resolveTreatment: resolveTreatment, requireEvidence: requireEvidence, calculate: calculate,
    regimeScreen: regimeScreen, classify: classify,
  };
});
