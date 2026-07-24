(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ETVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 15;
  var ZERO_RATE = 0;
  var REVIEWED_ON = "2026-07-22";
  var SOURCE_AS_OF = "2024-08-21";
  var ZERO_EVIDENCE = "proclamation-1341-schedule-1-zero-rated-supply";
  var TREATMENTS = {
    standard: { rate: STANDARD_RATE, evidenceType: null },
    "schedule-one-zero-confirmed": {
      rate: ZERO_RATE,
      evidenceType: ZERO_EVIDENCE,
    },
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

  function roundBirr(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function resolveTreatment(kind) {
    var key = kind || "standard";
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      throw new RangeError("unsupported Ethiopia VAT treatment");
    }
    return TREATMENTS[key];
  }

  function requireEvidence(kind, confirmed, evidenceType) {
    var treatment = resolveTreatment(kind);
    if (
      treatment.evidenceType &&
      (confirmed !== true || evidenceType !== treatment.evidenceType)
    ) {
      var error = new RangeError(
        "an exact Schedule 1 zero-rated supply match must be confirmed",
      );
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
    requireEvidence(
      rateKind,
      input.rateEvidenceConfirmed,
      input.rateEvidenceType,
    );
    var net = mode === "extract" ? entered / (1 + treatment.rate / 100) : entered;
    var roundedNet = roundBirr(net);
    var gross = mode === "extract" ? roundBirr(entered) : roundBirr(roundedNet * (1 + treatment.rate / 100));
    return {
      mode: mode,
      rateKind: rateKind,
      rate: treatment.rate,
      net: roundedNet,
      vat: roundBirr(gross - roundedNet),
      gross: gross,
      rounding: "nearest-santim",
      sourceAsOf: SOURCE_AS_OF,
    };
  }

  function classify(key) {
    if (key === "standard") {
      return {
        treatment: "standard",
        rate: STANDARD_RATE,
        note: "Article 8 applies the 15% rate to taxable supplies that are not zero-rated.",
      };
    }
    if (key === "schedule-one-zero-confirmed") {
      return {
        treatment: "confirmed",
        rate: ZERO_RATE,
        note: "Use 0% only after matching the transaction to an exact Schedule 1 zero-rated supply and retaining evidence.",
      };
    }
    return {
      treatment: "review",
      rate: null,
      note: "Do not infer zero-rating or exemption from a broad label. Check the current schedules and transaction evidence.",
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    ZERO_RATE: ZERO_RATE,
    REVIEWED_ON: REVIEWED_ON,
    SOURCE_AS_OF: SOURCE_AS_OF,
    ZERO_EVIDENCE: ZERO_EVIDENCE,
    TREATMENTS: TREATMENTS,
    formulaParameters: {
      standard: "15% for taxable supplies other than Schedule 1 zero-rated supplies under Proclamation 1341/2024 Article 8",
      zero: "0% only after an exact Schedule 1 match and retained evidence",
      exclusions: "Exempt supplies, registration threshold, withholding and transaction classification are not inferred",
      rounding: "Two decimal places in Ethiopian birr",
    },
    roundingPolicy: {
      method: "nearest-cent",
      precision: "0.01 ETB",
      stages: [
        "Round the amount before tax to two decimal places.",
        "Round the tax-inclusive amount to two decimal places, then calculate VAT as the rounded difference.",
      ],
    },
    resolveTreatment: resolveTreatment,
    requireEvidence: requireEvidence,
    calculate: calculate,
    classify: classify,
  };
});
