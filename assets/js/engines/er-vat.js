(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ERSalesTaxEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var REVIEWED_ON = "2026-07-22";
  var SOURCE_AS_OF = "2002-12-31";
  var TREATMENTS = {
    "goods-five-confirmed": { rate: 5, evidenceType: "listed-goods-five-percent" },
    "goods-twelve-confirmed": { rate: 12, evidenceType: "residual-goods-twelve-percent" },
    "services-five-confirmed": { rate: 5, evidenceType: "listed-services-five-percent" },
    "services-ten-confirmed": { rate: 10, evidenceType: "listed-services-ten-percent" },
    "zero-confirmed": { rate: 0, evidenceType: "listed-zero-or-exempt-case" },
  };
  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined")
      throw new RangeError(label + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0)
      throw new RangeError(label + " must be a non-negative number");
    return parsed;
  }
  function resolveTreatment(kind) {
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, kind))
      throw new RangeError("Select an evidenced sales-tax treatment");
    return TREATMENTS[kind];
  }
  function requireEvidence(kind, confirmed, evidenceType) {
    var treatment = resolveTreatment(kind);
    if (confirmed !== true || evidenceType !== treatment.evidenceType) {
      var error = new RangeError("Exact sales-tax evidence must be confirmed");
      error.code = "RATE_EVIDENCE_REQUIRED";
      throw error;
    }
    return treatment;
  }
  function round2(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }
  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount");
    var mode = input.mode === "extract" ? "extract" : "add";
    var treatment = requireEvidence(
      input.rateKind,
      input.rateEvidenceConfirmed,
      input.rateEvidenceType,
    );
    var net = mode === "extract" ? entered / (1 + treatment.rate / 100) : entered;
    var roundedNet = round2(net);
    var vat = mode === "extract" ? round2(entered - roundedNet) : round2(roundedNet * treatment.rate / 100);
    return {
      mode: mode,
      rateKind: input.rateKind,
      rate: treatment.rate,
      net: roundedNet,
      tax: vat,
      gross: mode === "extract" ? round2(entered) : round2(roundedNet + vat),
      legalCurrency: "ERN",
      currentRateConfirmed: false,
      sourceAsOf: SOURCE_AS_OF,
    };
  }
  return {
    REVIEWED_ON: REVIEWED_ON,
    SOURCE_AS_OF: SOURCE_AS_OF,
    TREATMENTS: TREATMENTS,
    formulaParameters: {
      system: "single-stage Eritrean sales-tax reference, not VAT",
      bands: "latest located authoritative public summary reports 0%, 5% and 12% goods bands and 5%/10% service bands",
      evidence: "every band fails closed until the user confirms an exact schedule or service-list match",
      freshness: "public source summary is as of December 2002; this tool does not assert current 2026 rates",
      rounding: "two-decimal planning arithmetic; no statutory rounding claim",
    },
    resolveTreatment: resolveTreatment,
    requireEvidence: requireEvidence,
    calculate: calculate,
  };
});
