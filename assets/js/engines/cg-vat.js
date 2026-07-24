(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.CGVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  // Keep the statutory VAT and centimes components explicit for auditability.
  var STANDARD_VAT_RATE = 18;
  var STANDARD_RATE = 18.9;
  var REDUCED_VAT_RATE = 5;
  var ADDITIONAL_CENTIMES_RATE = 5;
  var STANDARD_EFFECTIVE_RATE = 18.9;
  var REDUCED_EFFECTIVE_RATE = 5.25;
  var REGISTRATION_THRESHOLD = 100000000;
  var REVIEWED_ON = "2026-07-22";
  var TREATMENTS = {
    standard: { vatRate: 18, effectiveRate: 18.9, evidenceType: null },
    "annex-5-confirmed": { vatRate: 5, effectiveRate: 5.25, evidenceType: "annex-5-tariff-line" },
    "article-22-zero-confirmed": { vatRate: 0, effectiveRate: 0, evidenceType: "article-22-zero-case" },
  };
  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined") throw new RangeError(label + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(label + " must be a non-negative number");
    return parsed;
  }
  function roundMoney(value) { return Math.round((Number(value) + Number.EPSILON) * 100) / 100; }
  function resolveTreatment(rateKind) {
    var key = rateKind || "standard";
    if (!Object.prototype.hasOwnProperty.call(TREATMENTS, key)) throw new RangeError("unsupported VAT treatment");
    return TREATMENTS[key];
  }
  function requireEvidence(rateKind, confirmed, evidenceType) {
    var treatment = resolveTreatment(rateKind);
    if (!treatment.evidenceType) return;
    if (confirmed !== true || evidenceType !== treatment.evidenceType) {
      var error = new RangeError("exact Congo VAT evidence must be confirmed");
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
    var net = mode === "extract" ? entered / (1 + treatment.effectiveRate / 100) : entered;
    var vat = net * treatment.vatRate / 100;
    var centimes = vat * ADDITIONAL_CENTIMES_RATE / 100;
    var gross = mode === "extract" ? entered : net + vat + centimes;
    return {
      mode: mode,
      rateKind: rateKind,
      vatRate: treatment.vatRate,
      centimesRate: ADDITIONAL_CENTIMES_RATE,
      effectiveRate: treatment.effectiveRate,
      net: roundMoney(net),
      vat: roundMoney(vat),
      centimes: roundMoney(centimes),
      totalTax: roundMoney(vat + centimes),
      gross: roundMoney(gross),
    };
  }
  function calculateInvoice(line, options) {
    line = line || {}; options = options || {};
    var quantity = number(line.quantity, "quantity");
    var unitPrice = number(line.unitPrice, "unit price");
    return calculate({
      amount: roundMoney(quantity * unitPrice),
      rateKind: options.rateKind || "standard",
      rateEvidenceConfirmed: options.rateEvidenceConfirmed,
      rateEvidenceType: options.rateEvidenceType,
    });
  }
  function registrationScreen(turnover) {
    var amount = number(turnover, "annual turnover");
    return {
      status: amount >= REGISTRATION_THRESHOLD ? "real-regime-review" : "forfait-review",
      threshold: REGISTRATION_THRESHOLD,
      determinesRegistration: false,
    };
  }
  function classify(key) {
    if (Object.prototype.hasOwnProperty.call(TREATMENTS, key)) {
      var item = TREATMENTS[key];
      return { treatment: key === "standard" ? "standard" : "confirmed", rate: item.effectiveRate,
        note: key === "standard" ? "18% VAT plus centimes equal to 5% of VAT gives an 18.9% invoice burden." : "Use this treatment only when the exact tariff line or Article 22 evidence is confirmed." };
    }
    return { treatment: "review", rate: null, note: "Do not infer reduced, zero or exempt treatment from a broad category. Confirm the exact current legal provision and evidence." };
  }
  return {
    STANDARD_VAT_RATE: STANDARD_VAT_RATE,
    STANDARD_RATE: STANDARD_RATE,
    REDUCED_VAT_RATE: REDUCED_VAT_RATE,
    ADDITIONAL_CENTIMES_RATE: ADDITIONAL_CENTIMES_RATE,
    STANDARD_EFFECTIVE_RATE: STANDARD_EFFECTIVE_RATE,
    REDUCED_EFFECTIVE_RATE: REDUCED_EFFECTIVE_RATE,
    REGISTRATION_THRESHOLD: REGISTRATION_THRESHOLD,
    REVIEWED_ON: REVIEWED_ON,
    TREATMENTS: TREATMENTS,
    formulaParameters: {
      standard: "Article 22 general VAT rate 18%; Article 38 A centimes additionnels are 5% of collected VAT, producing an 18.9% invoice burden",
      reduced: "5% VAT only for the current Annex 5 tariff list; centimes produce a 5.25% invoice burden",
      zero: "0% only for Article 22 cases supported by the required evidence",
      threshold: "The 2026 Finance Law execution rules describe the forfait as annual turnover below XAF 100m; this screen does not decide registration",
      rounding: "Article 21 states that the VAT base is rounded down to the lower XAF 1,000 for filing; this planning calculator preserves entered precision and flags the filing rule",
    },
    resolveTreatment: resolveTreatment,
    requireEvidence: requireEvidence,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    registrationScreen: registrationScreen,
    classify: classify,
  };
});
