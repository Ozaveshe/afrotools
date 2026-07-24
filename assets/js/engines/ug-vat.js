(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.UGVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 18,
    THREE_MONTH_REGISTRATION_THRESHOLD = 37500000,
    ANNUAL_THRESHOLD_REFERENCE = 150000000,
    REVIEWED_ON = "2026-07-22";

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }
  function roundMoney(value) {
    return Math.round((finite(value, 0) + Number.EPSILON) * 100) / 100;
  }
  function normalizeAmount(value) {
    if (value === "" || value === null || typeof value === "undefined")
      throw new RangeError("amount must be a non-negative number");
    var number = finite(value, NaN);
    if (!Number.isFinite(number) || number < 0)
      throw new RangeError("amount must be a non-negative number");
    return number;
  }
  function normalizeRate(value) {
    if (value === "" || value === null || typeof value === "undefined")
      throw new RangeError("rate must be between 0 and 100");
    var number = finite(value, NaN);
    if (!Number.isFinite(number) || number < 0 || number > 100)
      throw new RangeError("rate must be between 0 and 100");
    return number;
  }
  function calculate(input) {
    input = input || {};
    var entered = normalizeAmount(input.amount),
      mode = input.mode === "extract" ? "extract" : "add",
      rateKind =
        input.rateKind === "scenario"
          ? "scenario"
          : input.rateKind === "zero"
            ? "zero"
            : "standard",
      rate =
        rateKind === "standard"
          ? STANDARD_RATE
          : rateKind === "zero"
            ? 0
            : normalizeRate(input.rate),
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
        source: "VAT Act, section 4 and current URA guidance",
      };
    if (key === "confirmed-zero")
      return {
        treatment: "zero-rated",
        rate: 0,
        source: "Confirmed under the Third Schedule to the VAT Act",
      };
    if (key === "confirmed-exempt")
      return {
        treatment: "exempt",
        rate: null,
        source: "Confirmed under the Second Schedule to the VAT Act",
      };
    if (key === "confirmed-designated-withholding")
      return {
        treatment: "withholding",
        rate: null,
        withholdingPercent: 6,
        withholdingBasis: "taxable-value",
        outputTaxContextRate: STANDARD_RATE,
        automaticCalculation: false,
        eligibilityConditions: [
          "payer-is-designated-vat-withholding-agent",
          "supplier-is-vat-registered-or-supply-is-at-least-37500000",
          "supplier-has-no-current-vat-withholding-exemption",
        ],
        source:
          "Section 5 VAT withholding is 6% of taxable value, not a VAT rate. No amount is modeled without confirming designation, supplier or supply eligibility, and exemption status.",
      };
    return {
      treatment: "review",
      rate: null,
      source: "Confirm the exact VAT Act provision and current URA treatment",
    };
  }
  function registrationBand(input) {
    input = input || {};
    var pastThreeMonths = normalizeAmount(input.pastThreeMonths || 0),
      expectedNextThreeMonths = normalizeAmount(
        input.expectedNextThreeMonths || 0,
      ),
      triggers = [];
    if (pastThreeMonths > THREE_MONTH_REGISTRATION_THRESHOLD)
      triggers.push("past-three-months");
    if (expectedNextThreeMonths > THREE_MONTH_REGISTRATION_THRESHOLD)
      triggers.push("expected-next-three-months");
    return {
      band: triggers.length ? "registration-required" : "below-threshold",
      triggers: triggers,
      annualThresholdReference: ANNUAL_THRESHOLD_REFERENCE,
      annualReferenceOnly: true,
    };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    THREE_MONTH_REGISTRATION_THRESHOLD: THREE_MONTH_REGISTRATION_THRESHOLD,
    ANNUAL_THRESHOLD_REFERENCE: ANNUAL_THRESHOLD_REFERENCE,
    REVIEWED_ON: REVIEWED_ON,
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    classify: classify,
    registrationBand: registrationBand,
  };
});
