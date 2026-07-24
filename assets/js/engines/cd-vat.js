(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.CDVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 16;
  var REDUCED_RATE = 8;
  var REGISTRATION_THRESHOLD = 80000000;
  var REVIEWED_ON = "2026-07-22";
  var TREATMENTS = {
    standard: { rate: 16, evidenceType: null },
    "current-reduced-item-confirmed": {
      rate: 8,
      evidenceType: "current-dgi-eight-percent-item",
    },
    "qualifying-export-confirmed": {
      rate: 0,
      evidenceType: "customs-export-declaration",
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
  function roundCdf(value) {
    return Math.round(Number(value));
  }
  function resolveTreatment(kind) {
    var key = kind || "standard";
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      throw new RangeError("unsupported DR Congo TVA treatment");
    }
    return TREATMENTS[key];
  }
  function requireEvidence(kind, confirmed, evidenceType) {
    var treatment = resolveTreatment(kind);
    if (
      treatment.evidenceType &&
      (confirmed !== true || evidenceType !== treatment.evidenceType)
    ) {
      var error = new RangeError("exact DR Congo TVA evidence is required");
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
    var roundedNet = roundCdf(net);
    var vat = mode === "extract" ? roundCdf(entered) - roundedNet : roundCdf((net * treatment.rate) / 100);
    return {
      mode: mode,
      rateKind: rateKind,
      rate: treatment.rate,
      net: roundedNet,
      vat: vat,
      gross: mode === "extract" ? roundCdf(entered) : roundedNet + vat,
      rounding: "nearest-CDF",
    };
  }
  function registrationScreen(turnover, liberalProfession) {
    var amount = number(turnover, "annual turnover");
    return {
      status: liberalProfession === true ? "liberal-profession-review" : amount >= REGISTRATION_THRESHOLD ? "threshold-review" : "below-threshold-review",
      threshold: REGISTRATION_THRESHOLD,
      determinesLiability: false,
    };
  }
  function classify(key) {
    if (Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      return {
        treatment: key === "standard" ? "standard" : "confirmed",
        rate: TREATMENTS[key].rate,
        note: key === "standard" ? "DGI states the current general TVA rate is 16%." : "Use only after matching the exact current legal case and retaining its evidence.",
      };
    }
    return { treatment: "review", rate: null, note: "Do not infer 8%, 0% or exemption from a broad label. Confirm the exact current treatment." };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    REDUCED_RATE: REDUCED_RATE,
    REGISTRATION_THRESHOLD: REGISTRATION_THRESHOLD,
    REVIEWED_ON: REVIEWED_ON,
    TREATMENTS: TREATMENTS,
    formulaParameters: {
      standard: "DGI current general rate: 16%",
      reduced: "8% only with an exact current DGI/legal item",
      zero: "0% only for a qualifying export with customs and declaration evidence",
      threshold: "CDF 80m annual-turnover review; liberal professions are specifically called out regardless of turnover",
      exclusions: "No generic mining, exemption, custom-rate or withholding treatment is inferred",
      rounding: "Whole-CDF planning estimate",
    },
    resolveTreatment: resolveTreatment,
    requireEvidence: requireEvidence,
    calculate: calculate,
    registrationScreen: registrationScreen,
    classify: classify,
  };
});
