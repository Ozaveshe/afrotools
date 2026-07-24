(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.SDVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 17;
  var CURRENCY = "SDG";
  var REVIEWED_ON = "2026-07-23";
  var SOURCE_AS_OF = "2026-03-28";

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

  function roundCent(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    input = input || {};
    var entered = parseAmount(input.amount);
    var mode = input.mode === "extract" ? "extract" : "add";
    var net = mode === "extract" ? entered / (1 + STANDARD_RATE / 100) : entered;
    var roundedNet = roundCent(net);
    var gross = mode === "extract"
      ? roundCent(entered)
      : roundCent(roundedNet * (1 + STANDARD_RATE / 100));
    return Object.freeze({
      mode: mode,
      rate: STANDARD_RATE,
      currency: CURRENCY,
      entered: roundCent(entered),
      net: roundedNet,
      vat: roundCent(gross - roundedNet),
      gross: gross,
      rounding: "nearest-cent",
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
      add: "VAT = net amount x 17%; gross = net amount + VAT",
      extract: "net amount = VAT-inclusive amount / 1.17; VAT = gross amount - net amount",
      exclusions: "No exemption, zero-rating, registration, filing, invoice-compliance, input-tax eligibility or transaction classification is inferred.",
      rounding: "Two decimal places in Sudanese pounds"
    }),
    roundingPolicy: Object.freeze({ method: "nearest-cent", precision: "0.01 SDG" })
  });
});
