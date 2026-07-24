(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.DZVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 19,
    REDUCED_RATE = 9,
    REVIEWED_ON = "2026-07-22";

  function number(value, label) {
    if (value === "" || value === null || typeof value === "undefined")
      throw new RangeError(label + " is required");
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0)
      throw new RangeError(label + " must be a non-negative number");
    return parsed;
  }
  function rate(value) {
    var parsed = number(value, "rate");
    if (parsed > 100) throw new RangeError("rate must not exceed 100");
    return parsed;
  }
  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }
  function resolveRate(input) {
    if (input.rateKind === "reduced") return REDUCED_RATE;
    if (input.rateKind === "scenario") return rate(input.rate);
    return STANDARD_RATE;
  }
  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount"),
      mode = input.mode === "extract" ? "extract" : "add",
      rateKind =
        input.rateKind === "reduced"
          ? "reduced"
          : input.rateKind === "scenario"
            ? "scenario"
            : "standard",
      usedRate = resolveRate({ rateKind: rateKind, rate: input.rate }),
      net = mode === "extract" ? entered / (1 + usedRate / 100) : entered,
      vat = (net * usedRate) / 100,
      gross = mode === "extract" ? entered : net + vat;
    return {
      mode: mode,
      rateKind: rateKind,
      rate: usedRate,
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
      result = calculate(
        Object.assign({}, input || {}, { amount: net, mode: "add" }),
      );
    result.lines = normalized;
    return result;
  }
  function classify(key) {
    if (key === "standard")
      return {
        treatment: "standard",
        rate: STANDARD_RATE,
        source: "DGI Algeria current VAT guidance: normal rate 19%",
      };
    if (key === "confirmed-reduced")
      return {
        treatment: "reduced",
        rate: REDUCED_RATE,
        source:
          "DGI Algeria: 9% only for operations listed in article 23 of the TCA Code",
      };
    if (key === "confirmed-exempt")
      return {
        treatment: "exempt",
        rate: null,
        source:
          "DGI Algeria: exemptions are enumerated in articles 8 to 13 of the TCA Code",
      };
    return {
      treatment: "review",
      rate: null,
      source: "Confirm the exact TCA Code provision and current DGI treatment",
    };
  }
  function regime(key) {
    if (key === "real" || key === "simplified")
      return { vatRelevant: true, status: key };
    if (key === "ifu")
      return {
        vatRelevant: false,
        status: "ifu",
        source:
          "DGI states that IFU taxpayers are not concerned by VAT and invoice tax-inclusive",
      };
    return { vatRelevant: null, status: "review" };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    REDUCED_RATE: REDUCED_RATE,
    REVIEWED_ON: REVIEWED_ON,
    formulaParameters: {
      standardRatePercent: STANDARD_RATE,
      reducedRatePercent: REDUCED_RATE,
      reducedTreatment: "confirmation-only article 23",
      exemptTreatment: "confirmation-only articles 8 to 13",
    },
    roundingPolicy: {
      method: "nearest-cent",
      precision: 2,
      stages: [
        "Round each invoice line before aggregation",
        "Round net, VAT and gross outputs",
      ],
    },
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    classify: classify,
    regime: regime,
  };
});
