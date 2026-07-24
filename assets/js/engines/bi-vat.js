(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.BIVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 18;
  var REDUCED_EVIDENCE_TYPES = Object.freeze([
    "obr-vat-2020-article-15-agricultural-input",
    "obr-vat-2020-article-15-locally-transformed-agricultural-product",
    "obr-vat-2020-article-15-minister-listed-foodstuff",
    "obr-vat-2020-article-15-hotel-product-or-service"
  ]);
  var ZERO_EVIDENCE_TYPES = Object.freeze([
    "obr-vat-2020-article-15-export-or-assimilated-operation",
    "obr-vat-2020-article-15-non-accessory-international-transport",
    "obr-vat-2020-article-15-export-intermediary-transaction"
  ]);
  var REGISTRATION_THRESHOLD = 25000000;
  var MAX_MONEY = 1000000000000000;
  var REVIEWED_ON = "2026-07-23";

  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined") throw new RangeError(label + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(label + " must be non-negative");
    return parsed;
  }

  function treatment(input) {
    var kind = input.rateKind || "standard";
    var allowed = kind === "confirmed-intermediate-ten" ? REDUCED_EVIDENCE_TYPES : kind === "confirmed-zero" ? ZERO_EVIDENCE_TYPES : null;
    if (["standard", "confirmed-intermediate-ten", "confirmed-zero"].indexOf(kind) === -1) throw new RangeError("unsupported Burundi VAT treatment");
    if (allowed && (input.rateEvidenceConfirmed !== true || allowed.indexOf(input.rateEvidenceType) === -1)) {
      var error = new RangeError("exact OBR VAT evidence is required");
      error.code = "RATE_EVIDENCE_REQUIRED";
      throw error;
    }
    return { kind: kind, rate: kind === "standard" ? 18 : kind === "confirmed-intermediate-ten" ? 10 : 0, rateEvidenceType: allowed ? input.rateEvidenceType : null };
  }

  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount");
    if (entered > MAX_MONEY) throw new RangeError("amount exceeds safe-money range");
    var selected = treatment(input);
    var mode = input.mode || "add";
    if (mode !== "add" && mode !== "extract") throw new RangeError("mode must be add or extract");
    var net = mode === "extract" ? entered / (1 + selected.rate / 100) : entered;
    var vat = mode === "extract" ? entered - net : net * selected.rate / 100;
    var gross = mode === "extract" ? entered : net + vat;
    if (!Number.isSafeInteger(Math.trunc(gross)) || gross > MAX_MONEY) throw new RangeError("result exceeds safe-money range");
    return Object.freeze({
      mode: mode, rateKind: selected.kind, rate: selected.rate, rateEvidenceType: selected.rateEvidenceType, entered: entered,
      net: net, vat: vat, gross: gross, currency: "BIF",
      displayRounding: "nearest-whole-BIF-by-AfroTools", sourceAsOf: REVIEWED_ON
    });
  }

  function screenRegistration(turnover) {
    var amount = number(turnover, "taxable turnover");
    if (amount > MAX_MONEY) throw new RangeError("taxable turnover exceeds safe-money range");
    return Object.freeze({
      taxableTurnover: amount,
      threshold: REGISTRATION_THRESHOLD,
      atOrAboveThreshold: amount >= REGISTRATION_THRESHOLD,
      chargingEffectiveFrom: "2026-07-01",
      monthlyDeclarationDueDay: 15
    });
  }

  return Object.freeze({
    STANDARD_RATE: STANDARD_RATE,
    REDUCED_EVIDENCE_TYPES: REDUCED_EVIDENCE_TYPES,
    ZERO_EVIDENCE_TYPES: ZERO_EVIDENCE_TYPES,
    REGISTRATION_THRESHOLD: REGISTRATION_THRESHOLD,
    MAX_MONEY: MAX_MONEY,
    REVIEWED_ON: REVIEWED_ON,
    calculate: calculate,
    screenRegistration: screenRegistration,
    formulaParameters: Object.freeze({
      standard: "18% of the taxable base",
      intermediate: "10% only for an exact Article 15 intermediate-rate supply",
      zero: "0% only for an exact Article 15 zero-rated operation",
      add: "VAT = net amount x rate; gross = net amount + VAT",
      extract: "net amount = VAT-inclusive amount / (1 + rate); VAT = gross - net",
      rounding: "Full-precision arithmetic; nearest whole BIF for AfroTools display only"
    })
  });
});
