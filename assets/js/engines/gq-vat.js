(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.GQVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 15;
  var REDUCED_RATE = 5;
  var ZERO_RATE = 0;
  var REVIEWED_ON = "2026-07-22";
  var TREATMENTS = {
    standard: { rate: STANDARD_RATE, evidenceType: null },
    "lpge-2026-reduced-import-confirmed": {
      rate: REDUCED_RATE,
      evidenceType: "lpge-2026-article-13-five-import-line",
    },
    "lpge-2026-zero-import-confirmed": {
      rate: ZERO_RATE,
      evidenceType: "lpge-2026-article-13-zero-import-line",
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

  function roundXaf(value) {
    return Math.round(Number(value));
  }

  function resolveTreatment(kind) {
    var key = kind || "standard";
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      throw new RangeError("unsupported Equatorial Guinea IVA treatment");
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
        "exact 2026 Budget Article 13 import evidence must be confirmed",
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
    var net =
      mode === "extract" ? entered / (1 + treatment.rate / 100) : entered;
    var roundedNet = roundXaf(net);
    var vat =
      mode === "extract"
        ? roundXaf(entered) - roundedNet
        : roundXaf((net * treatment.rate) / 100);
    return {
      mode: mode,
      rateKind: rateKind,
      rate: treatment.rate,
      net: roundedNet,
      vat: vat,
      gross: mode === "extract" ? roundXaf(entered) : roundedNet + vat,
      rounding: "nearest-XAF",
    };
  }

  function classify(key) {
    if (Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      return {
        treatment: key === "standard" ? "standard" : "confirmed",
        rate: TREATMENTS[key].rate,
        note:
          key === "standard"
            ? "The 2024 General Tax Law kept the general IVA rate at 15%."
            : "Use only after matching the exact imported product to its 2026 Budget Article 13 line.",
      };
    }
    return {
      treatment: "review",
      rate: null,
      note: "Do not infer 0%, 5% or exemption from a broad product label. Confirm the exact current legal and tariff treatment.",
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    REDUCED_RATE: REDUCED_RATE,
    ZERO_RATE: ZERO_RATE,
    REVIEWED_ON: REVIEWED_ON,
    TREATMENTS: TREATMENTS,
    formulaParameters: {
      standard:
        "15% general rate retained by Law 1/2024, according to the official government presentation",
      reduced:
        "5% only for an exact imported-product line in 2026 Budget Article 13",
      zero:
        "0% only for an exact imported-product line in 2026 Budget Article 13",
      exclusions:
        "No generic exemption, export, registration threshold, custom-rate or withholding treatment is inferred",
      rounding: "Display and calculation use whole XAF",
    },
    roundingPolicy: {
      method: "nearest-integer",
      precision: "whole XAF",
      stages: [
        "For add mode, round the VAT from the unrounded net amount, then add it to the rounded net amount.",
        "For extract mode, round the derived net amount and subtract it from the rounded gross amount.",
      ],
    },
    resolveTreatment: resolveTreatment,
    requireEvidence: requireEvidence,
    calculate: calculate,
    classify: classify,
  };
});
