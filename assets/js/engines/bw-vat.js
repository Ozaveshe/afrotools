(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.BWVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 14;
  var MANDATORY_THRESHOLD = 1000000;
  var VOLUNTARY_FLOOR = 500000;
  var REVIEWED_ON = "2026-07-22";

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

  function rate(value) {
    var parsed = number(value, "rate");
    if (parsed > 100) throw new RangeError("rate must not exceed 100");
    return parsed;
  }

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function resolveRate(input) {
    if (input.rateKind === "confirmed-zero") return 0;
    if (input.rateKind === "scenario") return rate(input.rate);
    return STANDARD_RATE;
  }

  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount");
    var mode = input.mode === "extract" ? "extract" : "add";
    var rateKind = input.rateKind === "confirmed-zero" ? "confirmed-zero" : input.rateKind === "scenario" ? "scenario" : "standard";
    var usedRate = resolveRate({ rateKind: rateKind, rate: input.rate });
    var net = mode === "extract" ? entered / (1 + usedRate / 100) : entered;
    var vat = (net * usedRate) / 100;
    var gross = mode === "extract" ? entered : net + vat;
    return {
      mode: mode,
      rateKind: rateKind,
      rate: usedRate,
      net: roundMoney(net),
      vat: roundMoney(vat),
      gross: roundMoney(gross),
    };
  }

  function calculateInvoice(lines, options) {
    if (!Array.isArray(lines) || !lines.length) throw new RangeError("at least one invoice line is required");
    options = options || {};
    var usedRate = resolveRate(options);
    var normalized = lines.map(function (line) {
      var quantity = number(line.quantity, "quantity");
      var unitPrice = number(line.unitPrice, "unit price");
      var lineRate = typeof line.rate === "undefined" ? usedRate : rate(line.rate);
      var net = roundMoney(quantity * unitPrice);
      return {
        description: String(line.description || ""),
        quantity: quantity,
        unitPrice: unitPrice,
        rate: lineRate,
        net: net,
        vat: roundMoney((net * lineRate) / 100),
      };
    });
    var net = roundMoney(normalized.reduce(function (sum, line) { return sum + line.net; }, 0));
    var vat = roundMoney(normalized.reduce(function (sum, line) { return sum + line.vat; }, 0));
    return {
      lines: normalized,
      net: net,
      vat: vat,
      gross: roundMoney(net + vat),
      effectiveRate: net ? roundMoney((vat / net) * 100) : 0,
    };
  }

  function registration(turnover) {
    var amount = number(turnover, "turnover");
    if (amount > MANDATORY_THRESHOLD) return { status: "mandatory", threshold: MANDATORY_THRESHOLD };
    if (amount >= VOLUNTARY_FLOOR) return { status: "voluntary", threshold: MANDATORY_THRESHOLD };
    return { status: "below-voluntary-floor", threshold: VOLUNTARY_FLOOR };
  }

  function classify(key) {
    if (key === "standard") return { treatment: "standard", rate: STANDARD_RATE, source: "BURS current 14% standard-rate material" };
    if (key === "confirmed-zero") return { treatment: "zero", rate: 0, source: "Use only after confirming the current statutory schedule" };
    if (key === "confirmed-exempt") return { treatment: "exempt", rate: null, source: "Use only after confirming the current statutory schedule" };
    return { treatment: "review", rate: null, source: "Confirm classification with BURS before invoicing or filing" };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    MANDATORY_THRESHOLD: MANDATORY_THRESHOLD,
    VOLUNTARY_FLOOR: VOLUNTARY_FLOOR,
    REVIEWED_ON: REVIEWED_ON,
    formulaParameters: {
      standardRatePercent: STANDARD_RATE,
      compulsoryRegistration: "taxable supplies above BWP 1,000,000 in a 12-month period",
      voluntaryRegistration: "taxable supplies from BWP 500,000 through BWP 1,000,000, subject to BURS approval",
      zeroAndExemptTreatment: "confirmation-only against the current statutory schedules",
      digitalServicesContext: "remote digital-services changes announced for 2026 require BURS confirmation and are not separately calculated",
    },
    roundingPolicy: {
      method: "nearest-thebe",
      precision: 2,
      stages: ["Round each invoice line net and VAT amount before aggregation", "Round displayed net, VAT and gross outputs to two decimal places"],
    },
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    registration: registration,
    classify: classify,
  };
});
