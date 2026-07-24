(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.TZVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 18,
    CONDITIONAL_EPAYMENT_RATE = 16,
    WITHHOLDING_POINTS = 3,
    REGISTRATION_THRESHOLD = 200000000,
    SIX_MONTH_THRESHOLD = 100000000,
    CONDITIONAL_RATE_EFFECTIVE = "2025-09-01",
    REVIEWED_ON = "2026-07-22";
  function finite(v, f) {
    var n = Number(v);
    return Number.isFinite(n) ? n : f;
  }
  function roundMoney(v) {
    return Math.round((finite(v, 0) + Number.EPSILON) * 100) / 100;
  }
  function amount(v) {
    var n = finite(v, NaN);
    if (!Number.isFinite(n) || n < 0)
      throw new RangeError("amount must be a non-negative number");
    return n;
  }
  function rate(v) {
    var n = finite(v, NaN);
    if (!Number.isFinite(n) || n < 0 || n > 100)
      throw new RangeError("rate must be between 0 and 100");
    return n;
  }
  function calculate(input) {
    input = input || {};
    var entered = amount(input.amount),
      usedRate = rate(input.rate == null ? STANDARD_RATE : input.rate),
      mode = input.mode === "extract" ? "extract" : "add",
      net = mode === "extract" ? entered / (1 + usedRate / 100) : entered,
      vat = (net * usedRate) / 100,
      gross = mode === "extract" ? entered : net + vat;
    return {
      mode: mode,
      rate: usedRate,
      rateKind: input.rateKind || "standard",
      net: roundMoney(net),
      vat: roundMoney(vat),
      gross: roundMoney(gross),
    };
  }
  function calculateInvoice(lines, usedRate, rateKind) {
    if (!Array.isArray(lines) || !lines.length)
      throw new RangeError("at least one invoice line is required");
    var normalized = lines.map(function (line) {
        var quantity = amount(line.quantity),
          unitPrice = amount(line.unitPrice);
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
        rate: usedRate,
        rateKind: rateKind,
        mode: "add",
      });
    result.lines = normalized;
    return result;
  }
  function calculateWithholdingAgent(netAmount) {
    var net = amount(netAmount),
      vat = roundMoney((net * STANDARD_RATE) / 100),
      retained = roundMoney((net * WITHHOLDING_POINTS) / 100),
      supplierVat = roundMoney(vat - retained);
    return {
      net: roundMoney(net),
      vat: vat,
      retained: retained,
      supplierVat: supplierVat,
      invoiceGross: roundMoney(net + vat),
      supplierPayment: roundMoney(net + supplierVat),
    };
  }
  function classify(key) {
    if (key === "standard")
      return {
        treatment: "standard",
        rate: STANDARD_RATE,
        source: "Value Added Tax Act, section 5",
      };
    if (key === "confirmed-epayment")
      return {
        treatment: "conditional",
        rate: CONDITIONAL_EPAYMENT_RATE,
        source:
          "Finance Act 2025, section 125; only after confirming the current TRA public-notice conditions",
      };
    if (key === "confirmed-withholding")
      return {
        treatment: "withholding",
        rate: STANDARD_RATE,
        source:
          "Finance Act 2025, section 125: appointed agent retains 3 percentage points of an 18% standard-rated supply",
      };
    if (key === "confirmed-zero")
      return {
        treatment: "zero-rated",
        rate: 0,
        source: "Confirmed under the VAT Act zero-rate schedule",
      };
    if (key === "confirmed-exempt")
      return {
        treatment: "exempt",
        rate: null,
        source: "Confirmed under the VAT Act exemption schedule",
      };
    return {
      treatment: "review",
      rate: null,
      source:
        "Confirm the exact VAT Act or Finance Act provision and current TRA notice",
    };
  }
  function registrationBand(input) {
    if (typeof input !== "object" || input === null) input = { prior12: input };
    var prospective12 = amount(input.prospective12 || 0),
      prior12 = amount(input.prior12 || 0),
      prior6 = amount(input.prior6 || 0),
      triggers = [];
    if (prospective12 >= REGISTRATION_THRESHOLD)
      triggers.push("prospective-12-month");
    if (prior12 >= REGISTRATION_THRESHOLD) triggers.push("prior-12-month");
    if (prior6 >= SIX_MONTH_THRESHOLD) triggers.push("prior-6-month");
    return {
      band: triggers.length ? "threshold-review" : "below-threshold",
      triggers: triggers,
    };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    CONDITIONAL_EPAYMENT_RATE: CONDITIONAL_EPAYMENT_RATE,
    WITHHOLDING_POINTS: WITHHOLDING_POINTS,
    REGISTRATION_THRESHOLD: REGISTRATION_THRESHOLD,
    SIX_MONTH_THRESHOLD: SIX_MONTH_THRESHOLD,
    CONDITIONAL_RATE_EFFECTIVE: CONDITIONAL_RATE_EFFECTIVE,
    REVIEWED_ON: REVIEWED_ON,
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    calculateWithholdingAgent: calculateWithholdingAgent,
    classify: classify,
    registrationBand: registrationBand,
  };
});
