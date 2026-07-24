(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.ZWVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 15.5;
  var ALLOWED_CURRENCIES = Object.freeze(["ZWG", "USD"]);
  var REVIEWED_ON = "2026-07-23";
  var SOURCE_AS_OF = "2026-07-23";

  function parseAmount(value) {
    if (value === "" || value === null || typeof value === "undefined") throw new RangeError("amount is required");
    var amount = Number(value);
    if (!Number.isFinite(amount) || amount < 0) throw new RangeError("amount must be a non-negative number");
    return amount;
  }

  function parseCurrency(value) {
    var currency = String(value || "ZWG").toUpperCase();
    if (ALLOWED_CURRENCIES.indexOf(currency) === -1) throw new RangeError("currency must be ZWG or USD");
    return currency;
  }

  function roundCent(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    input = input || {};
    var entered = parseAmount(input.amount);
    var currency = parseCurrency(input.currency);
    var mode = input.mode === "extract" ? "extract" : "add";
    var net = mode === "extract" ? entered / 1.155 : entered;
    var roundedNet = roundCent(net);
    var gross = mode === "extract" ? roundCent(entered) : roundCent(roundedNet * 1.155);
    return Object.freeze({
      mode: mode, rate: STANDARD_RATE, currency: currency, entered: roundCent(entered),
      net: roundedNet, vat: roundCent(gross - roundedNet), gross: gross,
      rounding: "nearest-cent", sourceAsOf: SOURCE_AS_OF
    });
  }

  return Object.freeze({
    STANDARD_RATE: STANDARD_RATE,
    ALLOWED_CURRENCIES: ALLOWED_CURRENCIES,
    REVIEWED_ON: REVIEWED_ON,
    SOURCE_AS_OF: SOURCE_AS_OF,
    calculate: calculate,
    formulaParameters: Object.freeze({
      add: "VAT = net amount x 15.5%; gross = net amount + VAT",
      extract: "net amount = VAT-inclusive amount / 1.155; VAT = gross amount - net amount",
      exclusions: "No zero-rate, exemption, tourism, export, registration, fiscalisation, filing or input-tax treatment is inferred.",
      currencies: "ZWG or USD, selected explicitly; legacy ZWL is rejected",
      rounding: "Nearest cent"
    }),
    roundingPolicy: Object.freeze({ method: "nearest-cent", precision: "0.01" })
  });
});
