(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.AOVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 14,
    RATES = {
      standard: STANDARD_RATE,
      simplified: 7,
      hospitality: 7,
      food: 5,
      cabinda: 1,
    },
    REVIEWED_ON = "2026-07-22";

  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined")
      throw new RangeError(label + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0)
      throw new RangeError(label + " must be a non-negative number");
    return parsed;
  }
  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }
  function resolveRate(rateKind) {
    return Object.prototype.hasOwnProperty.call(RATES, rateKind)
      ? RATES[rateKind]
      : RATES.standard;
  }
  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount"),
      mode = input.mode === "extract" ? "extract" : "add",
      rateKind = Object.prototype.hasOwnProperty.call(RATES, input.rateKind)
        ? input.rateKind
        : "standard",
      rate = resolveRate(rateKind),
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
        var quantity = number(line.quantity, "quantity"),
          unitPrice = number(line.unitPrice, "unit price");
        return {
          description: String(line.description || ""),
          quantity: quantity,
          unitPrice: unitPrice,
          net: roundMoney(quantity * unitPrice),
        };
      }),
      net = roundMoney(
        normalized.reduce(function (sum, line) {
          return sum + line.net;
        }, 0),
      ),
      result = calculate({
        amount: net,
        mode: "add",
        rateKind: input && input.rateKind,
      });
    result.lines = normalized;
    return result;
  }
  function classify(key) {
    if (key === "standard")
      return { treatment: "standard", rateKind: "standard" };
    if (key === "simplified")
      return { treatment: "reduced", rateKind: "simplified" };
    if (key === "hospitality")
      return { treatment: "reduced", rateKind: "hospitality" };
    if (key === "food") return { treatment: "reduced", rateKind: "food" };
    if (key === "cabinda") return { treatment: "reduced", rateKind: "cabinda" };
    if (key === "exempt") return { treatment: "exempt", rateKind: null };
    return { treatment: "review", rateKind: null };
  }
  function regime(turnover, manufacturing, voluntary) {
    var annual = number(turnover, "annual turnover");
    if (voluntary) return { status: "general-voluntary", rateKind: "standard" };
    if (manufacturing && annual > 25000000)
      return { status: "general-manufacturing", rateKind: "standard" };
    if (annual >= 350000000) return { status: "general", rateKind: "standard" };
    if (annual >= 25000000)
      return { status: "simplified", rateKind: "simplified" };
    return { status: "excluded", rateKind: null };
  }
  function captive(vat, entity) {
    var tax = number(vat, "VAT"),
      rate = 0;
    if (entity === "article21-1") rate = 100;
    if (entity === "article21-2") rate = 50;
    return {
      eligible: rate > 0,
      percent: rate,
      captive: roundMoney((tax * rate) / 100),
      supplierReceives: roundMoney((tax * (100 - rate)) / 100),
    };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    RATES: RATES,
    REVIEWED_ON: REVIEWED_ON,
    formulaParameters: {
      standardRatePercent: 14,
      simplifiedRatePercent: 7,
      hospitalityRatePercent: 7,
      foodAndAgriculturalInputsRatePercent: 5,
      eligibleCabindaRatePercent: 1,
      excludedRegimeTurnoverBelowAoa: 25000000,
      generalRegimeTurnoverFromAoa: 350000000,
    },
    roundingPolicy: {
      method: "nearest-cent",
      precision: 2,
      stages: [
        "invoice-line-net",
        "displayed-net",
        "displayed-vat",
        "displayed-gross",
      ],
    },
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    classify: classify,
    regime: regime,
    captive: captive,
  };
});
