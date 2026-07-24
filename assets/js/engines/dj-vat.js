(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) { root.AfroTools = root.AfroTools || {}; root.AfroTools.DJVatEngine = api; }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 10;
  var NEXT_YEAR_THRESHOLD = 80000000;
  var IMMEDIATE_THRESHOLD = 120000000;
  var REVIEWED_ON = "2026-07-22";
  var TREATMENTS = {
    standard: { rate: 10, evidenceType: null },
    "article-19-export-confirmed": { rate: 0, evidenceType: "customs-export-declaration" },
    "article-19-trade-confirmed": { rate: 0, evidenceType: "article-19-international-trade-proof" },
    "article-8-exempt-confirmed": { rate: 0, evidenceType: "article-8-exemption-item" },
  };
  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined") throw new RangeError(label + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(label + " must be a non-negative number");
    return parsed;
  }
  function roundFranc(value) { return Math.round(Number(value)); }
  function resolveTreatment(kind) {
    var key = kind || "standard";
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, key)) throw new RangeError("unsupported VAT treatment");
    return TREATMENTS[key];
  }
  function requireEvidence(kind, confirmed, evidenceType) {
    var treatment = resolveTreatment(kind);
    if (treatment.evidenceType && (confirmed !== true || evidenceType !== treatment.evidenceType)) {
      var error = new RangeError("exact Djibouti VAT evidence must be confirmed");
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
    var roundedNet = roundFranc(net);
    var vat = mode === "extract" ? roundFranc(entered) - roundedNet : roundFranc(net * treatment.rate / 100);
    return { mode: mode, rateKind: rateKind, rate: treatment.rate, net: roundedNet, vat: vat, gross: mode === "extract" ? roundFranc(entered) : roundedNet + vat, rounding: "nearest-FDJ" };
  }
  function thresholdScreen(turnover) {
    var amount = number(turnover, "annual turnover");
    return {
      status: amount >= IMMEDIATE_THRESHOLD ? "immediate-review" : amount >= NEXT_YEAR_THRESHOLD ? "next-year-review" : "below-threshold-review",
      nextYearThreshold: NEXT_YEAR_THRESHOLD,
      immediateThreshold: IMMEDIATE_THRESHOLD,
      determinesLiability: false,
    };
  }
  function classify(key) {
    if (Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      return { treatment: key === "standard" ? "standard" : "confirmed", rate: TREATMENTS[key].rate,
        note: key === "standard" ? "Later official finance laws evidence the current 10% standard VAT rate." : "Use only after matching the exact statutory case and retaining its required evidence." };
    }
    return { treatment: "review", rate: null, note: "Do not infer 0% or exemption from a broad label. Confirm the exact Article 8, 12 or 19 case." };
  }
  return {
    STANDARD_RATE: STANDARD_RATE, NEXT_YEAR_THRESHOLD: NEXT_YEAR_THRESHOLD, IMMEDIATE_THRESHOLD: IMMEDIATE_THRESHOLD,
    REVIEWED_ON: REVIEWED_ON, TREATMENTS: TREATMENTS,
    formulaParameters: {
      standard: "10% current standard rate evidenced by later official finance laws; the original 2008 law page still shows superseded 7% text",
      zero: "0% only for the exact Article 19 export or international-trade cases with required customs, attestation or transaction evidence",
      exemption: "0 tax in this calculator only after confirming an exact Article 8 exemption; exemption is distinct from zero rating",
      thresholds: "Article 6: annual turnover at least FDJ 80m triggers next-year review; crossing FDJ 120m triggers review from the crossing month",
      rounding: "Article 39: declared VAT amounts are rounded to the nearest Djibouti franc",
    },
    resolveTreatment: resolveTreatment, requireEvidence: requireEvidence, calculate: calculate,
    thresholdScreen: thresholdScreen, classify: classify,
  };
});
