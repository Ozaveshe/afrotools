(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.RWVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 18,
    ANNUAL_REGISTRATION_THRESHOLD = 20000000,
    QUARTER_REGISTRATION_THRESHOLD = 5000000,
    REVIEWED_ON = "2026-07-22";

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  function roundMoney(value) {
    return Math.round((finite(value, 0) + Number.EPSILON) * 100) / 100;
  }
  function normalizeAmount(value) {
    var number = finite(value, NaN);
    if (!Number.isFinite(number) || number < 0)
      throw new RangeError("amount must be a non-negative number");
    return number;
  }
  function normalizeRate(value) {
    var number = finite(value, NaN);
    if (!Number.isFinite(number) || number < 0 || number > 100)
      throw new RangeError("rate must be between 0 and 100");
    return number;
  }
  function calculate(input) {
    input = input || {};
    var entered = normalizeAmount(input.amount),
      mode = input.mode === "extract" ? "extract" : "add",
      rateKind = input.rateKind === "scenario" ? "scenario" : input.rateKind === "zero" ? "zero" : "standard",
      rate = rateKind === "standard" ? STANDARD_RATE : rateKind === "zero" ? 0 : normalizeRate(input.rate),
      net = mode === "extract" ? entered / (1 + rate / 100) : entered,
      vat = (net * rate) / 100,
      gross = mode === "extract" ? entered : net + vat;
    return {
      mode: mode,
      rateKind: rateKind,
      rate: rate,
      net: roundMoney(net),
      vat: roundMoney(vat),
      gross: roundMoney(gross),
    };
  }
  function calculateInvoice(lines, input) {
    if (!Array.isArray(lines) || !lines.length)
      throw new RangeError("at least one invoice line is required");
    var normalized = lines.map(function (line) {
        var quantity = normalizeAmount(line.quantity),
          unitPrice = normalizeAmount(line.unitPrice);
        return {
          description: String(line.description || ""),
          quantity: quantity,
          unitPrice: unitPrice,
          net: roundMoney(quantity * unitPrice),
        };
      }),
      net = roundMoney(normalized.reduce(function (sum, line) { return sum + line.net; }, 0)),
      result = calculate(Object.assign({}, input || {}, { amount: net, mode: "add" }));
    result.lines = normalized;
    return result;
  }
  function classify(key) {
    if (key === "standard")
      return { treatment: "standard", rate: STANDARD_RATE, source: "Law No. 049/2023, Article 4" };
    if (key === "confirmed-zero")
      return { treatment: "zero-rated", rate: 0, source: "Confirmed under Law No. 049/2023, Article 7" };
    if (key === "confirmed-exempt")
      return { treatment: "exempt", rate: null, source: "Confirmed under Article 8 as amended by Law No. 009/2025" };
    return { treatment: "review", rate: null, source: "Confirm the exact provision in the current VAT law and schedules" };
  }
  function registrationBand(input) {
    input = input || {};
    var annual = normalizeAmount(input.previousFiscalYear || 0),
      quarter = normalizeAmount(input.previousQuarter || 0),
      triggers = [];
    if (annual > ANNUAL_REGISTRATION_THRESHOLD) triggers.push("previous-fiscal-year");
    if (quarter > QUARTER_REGISTRATION_THRESHOLD) triggers.push("previous-quarter");
    return { band: triggers.length ? "registration-required" : "below-threshold", triggers: triggers };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    ANNUAL_REGISTRATION_THRESHOLD: ANNUAL_REGISTRATION_THRESHOLD,
    QUARTER_REGISTRATION_THRESHOLD: QUARTER_REGISTRATION_THRESHOLD,
    REVIEWED_ON: REVIEWED_ON,
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    classify: classify,
    registrationBand: registrationBand,
  };
});
