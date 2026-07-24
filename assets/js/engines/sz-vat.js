(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.SZVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 15;
  var ZERO_RATE = 0;
  var REVIEWED_ON = "2026-07-22";
  var SOURCE_AS_OF = "2025-11-07";
  var ZERO_EVIDENCE = "vat-act-current-second-schedule-zero-rated-supply";
  var TREATMENTS = {
    standard: { rate: STANDARD_RATE, evidenceType: null },
    "second-schedule-zero-confirmed": { rate: ZERO_RATE, evidenceType: ZERO_EVIDENCE },
  };

  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined") {
      throw new RangeError(label + " is required");
    }
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new RangeError(label + " must be a non-negative number");
    }
    return parsed;
  }

  function roundCent(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function resolveTreatment(kind) {
    var key = kind || "standard";
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      throw new RangeError("unsupported Eswatini VAT treatment");
    }
    return TREATMENTS[key];
  }

  function requireEvidence(kind, confirmed, evidenceType) {
    var treatment = resolveTreatment(kind);
    if (treatment.evidenceType && (confirmed !== true || evidenceType !== treatment.evidenceType)) {
      var error = new RangeError("an exact current Second Schedule zero-rated supply match must be confirmed");
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
    var roundedNet = roundCent(net);
    var gross = mode === "extract" ? roundCent(entered) : roundCent(roundedNet * (1 + treatment.rate / 100));
    return {
      mode: mode,
      rateKind: rateKind,
      rate: treatment.rate,
      net: roundedNet,
      vat: roundCent(gross - roundedNet),
      gross: gross,
      rounding: "nearest-cent",
      sourceAsOf: SOURCE_AS_OF,
    };
  }

  function classify(key) {
    if (key === "standard") return { treatment: "standard", rate: STANDARD_RATE, note: "Use 15% for an ordinary taxable supply." };
    if (key === "second-schedule-zero-confirmed") return { treatment: "confirmed", rate: ZERO_RATE, note: "Use 0% only after matching the transaction to an exact current Second Schedule line and retaining evidence." };
    return { treatment: "review", rate: null, note: "Do not infer zero-rating or exemption from a broad label. Check the current schedules and transaction evidence." };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    ZERO_RATE: ZERO_RATE,
    REVIEWED_ON: REVIEWED_ON,
    SOURCE_AS_OF: SOURCE_AS_OF,
    ZERO_EVIDENCE: ZERO_EVIDENCE,
    TREATMENTS: TREATMENTS,
    formulaParameters: {
      standard: "15% for taxable supplies that are not zero-rated under the current Second Schedule",
      zero: "0% only after an exact current Second Schedule match and retained evidence",
      exclusions: "Exempt supplies, registration, withholding, filing and transaction classification are not inferred",
      rounding: "Two decimal places in lilangeni",
    },
    roundingPolicy: { method: "nearest-cent", precision: "0.01 SZL" },
    resolveTreatment: resolveTreatment,
    requireEvidence: requireEvidence,
    calculate: calculate,
    classify: classify,
  };
});
