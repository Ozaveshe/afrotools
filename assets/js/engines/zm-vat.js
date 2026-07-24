(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ZMVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 16;
  var CURRENCY = "ZMW";
  var REVIEWED_ON = "2026-07-23";
  var SOURCE_AS_OF = "2026-07-23";

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

  function roundNgwee(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    input = input || {};
    var entered = parseAmount(input.amount);
    var mode = input.mode === "extract" ? "extract" : "add";
    var net = mode === "extract" ? entered / 1.16 : entered;
    var roundedNet = roundNgwee(net);
    var gross = mode === "extract" ? roundNgwee(entered) : roundNgwee(roundedNet * 1.16);
    return Object.freeze({
      mode: mode,
      rate: STANDARD_RATE,
      currency: CURRENCY,
      entered: roundNgwee(entered),
      net: roundedNet,
      vat: roundNgwee(gross - roundedNet),
      gross: gross,
      rounding: "nearest-ngwee",
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
      add: "VAT = net amount x 16%; gross = net amount + VAT",
      extract: "net amount = VAT-inclusive amount / 1.16; VAT = gross amount - net amount",
      exclusions: "No zero-rated, exempt, LPO/project, export, filing, registration, invoice-code or input-tax treatment is inferred.",
      rounding: "Nearest ngwee (0.01 ZMW)"
    }),
    roundingPolicy: Object.freeze({ method: "nearest-ngwee", precision: "0.01 ZMW" })
  });
});
