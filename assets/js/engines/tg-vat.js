(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.TGVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 18;
  var CURRENCY = "XOF";
  var REVIEWED_ON = "2026-07-23";
  var SOURCE_AS_OF = "2026-06-23";

  function parseAmount(value) {
    if (value === "" || value === null || typeof value === "undefined") {
      throw new RangeError("amount is required");
    }
    var amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) {
      throw new RangeError("amount must be a non-negative number");
    }
    return amount;
  }

  function roundFranc(value) {
    return Math.round(Number(value) + Number.EPSILON);
  }

  function calculate(input) {
    input = input || {};
    var entered = parseAmount(input.amount);
    var mode = input.mode === "extract" ? "extract" : "add";
    var net = mode === "extract" ? entered / (1 + STANDARD_RATE / 100) : entered;
    var roundedNet = roundFranc(net);
    var gross = mode === "extract"
      ? roundFranc(entered)
      : roundFranc(roundedNet * (1 + STANDARD_RATE / 100));
    return Object.freeze({
      mode: mode,
      rate: STANDARD_RATE,
      currency: CURRENCY,
      entered: roundFranc(entered),
      net: roundedNet,
      vat: roundFranc(gross - roundedNet),
      gross: gross,
      rounding: "nearest-franc",
      sourceAsOf: SOURCE_AS_OF
    });
  }

  return Object.freeze({
    STANDARD_RATE: STANDARD_RATE,
    CURRENCY: CURRENCY,
    REVIEWED_ON: REVIEWED_ON,
    SOURCE_AS_OF: SOURCE_AS_OF,
    calculate: calculate,
    formulaParameters: Object.freeze({
      add: "VAT = net amount x 18%; gross = net amount + VAT",
      extract: "net amount = VAT-inclusive amount / 1.18; VAT = gross amount - net amount",
      exclusions: "No Article 180 exemption, later 2026 measure, export, prepayment, leasing, registration, filing, invoice-compliance, input-tax eligibility or transaction classification is inferred.",
      rounding: "Nearest West African CFA franc"
    }),
    roundingPolicy: Object.freeze({ method: "nearest-franc", precision: "1 XOF" })
  });
});
