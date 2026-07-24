(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.KMConsumptionTaxEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var STANDARD_RATE = 10;
  var GENERAL_THRESHOLD = 20000000;
  var IMPORTER_EXCEPTION_START = 15000000;
  var REVIEWED_ON = "2026-07-22";
  var RATES = {
    standard: 10,
    "article-152-utilities-interisland-confirmed": 3,
    "article-152-hospitality-bank-fixed-confirmed": 5,
    "article-152-international-transport-confirmed": 5,
    "article-152-mobile-recharge-confirmed": 7.5,
    "article-152-casino-confirmed": 25,
    "article-152-essential-list-confirmed": 0,
  };
  var EVIDENCE_TYPES = {
    "article-152-utilities-interisland-confirmed":
      "article-152-utilities-interisland",
    "article-152-hospitality-bank-fixed-confirmed":
      "article-152-five-percent-supply",
    "article-152-international-transport-confirmed":
      "article-152-five-percent-supply",
    "article-152-mobile-recharge-confirmed": "article-152-mobile-recharge",
    "article-152-casino-confirmed": "article-152-casino",
    "article-152-essential-list-confirmed": "article-152-essential-list",
  };
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
    var key = rateKind || "standard";
    if (!Object.prototype.hasOwnProperty.call(RATES, key))
      throw new RangeError("unsupported tax treatment");
    return RATES[key];
  }
  function requireRateEvidence(rateKind, evidenceConfirmed, evidenceType) {
    if (rateKind === "standard") return;
    if (
      evidenceConfirmed !== true ||
      evidenceType !== EVIDENCE_TYPES[rateKind]
    ) {
      var error = new RangeError(
        "exact Article 152 rate evidence must be confirmed",
      );
      error.code = "RATE_EVIDENCE_REQUIRED";
      throw error;
    }
  }
  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount");
    var mode = input.mode === "extract" ? "extract" : "add";
    var rateKind = input.rateKind || "standard";
    var rate = resolveRate(rateKind);
    requireRateEvidence(
      rateKind,
      input.rateEvidenceConfirmed,
      input.rateEvidenceType,
    );
    var net = mode === "extract" ? entered / (1 + rate / 100) : entered;
    var tax = (net * rate) / 100;
    var gross = mode === "extract" ? entered : net + tax;
    return {
      mode: mode,
      rateKind: rateKind,
      rate: rate,
      net: roundMoney(net),
      tax: roundMoney(tax),
      gross: roundMoney(gross),
    };
  }
  function calculateInvoice(line, options) {
    line = line || {};
    options = options || {};
    var quantity = number(line.quantity, "quantity");
    var unitPrice = number(line.unitPrice, "unit price");
    var result = calculate({
      amount: roundMoney(quantity * unitPrice),
      rateKind: options.rateKind || "standard",
      rateEvidenceConfirmed: options.rateEvidenceConfirmed,
      rateEvidenceType: options.rateEvidenceType,
    });
    return {
      description: String(line.description || ""),
      quantity: quantity,
      unitPrice: unitPrice,
      rateKind: result.rateKind,
      rate: result.rate,
      net: result.net,
      tax: result.tax,
      gross: result.gross,
    };
  }
  function calculateInvoiceTotals(lines) {
    if (!Array.isArray(lines) || !lines.length)
      throw new RangeError("at least one invoice line is required");
    return lines.reduce(
      function (totals, line) {
        var result = calculateInvoice(line, {
          rateKind: line.rateKind,
          rateEvidenceConfirmed: line.rateEvidenceConfirmed,
          rateEvidenceType: line.rateEvidenceType,
        });
        totals.net = roundMoney(totals.net + result.net);
        totals.tax = roundMoney(totals.tax + result.tax);
        totals.gross = roundMoney(totals.gross + result.gross);
        return totals;
      },
      { net: 0, tax: 0, gross: 0 },
    );
  }
  function classify(key) {
    if (Object.prototype.hasOwnProperty.call(RATES, key))
      return {
        treatment: key === "standard" ? "standard" : "confirmed",
        rate: RATES[key],
        note:
          key === "standard"
            ? "The reference consumption-tax rate is 10%."
            : "Apply this Article 152 rate only when the exact supply and evidence match.",
      };
    return {
      treatment: "review",
      rate: null,
      note: "Do not infer a reduced, zero or exempt treatment from a broad category. Confirm the exact legal provision and current DGI evidence.",
    };
  }
  function thresholdScreen(turnover, importerConfirmed) {
    var amount = number(turnover, "annual turnover");
    if (amount >= GENERAL_THRESHOLD)
      return { status: "taxable-review", threshold: GENERAL_THRESHOLD };
    if (
      importerConfirmed &&
      amount >= IMPORTER_EXCEPTION_START &&
      amount < GENERAL_THRESHOLD
    )
      return {
        status: "importer-exception-review",
        threshold: GENERAL_THRESHOLD,
      };
    return { status: "below-threshold-review", threshold: GENERAL_THRESHOLD };
  }
  return {
    STANDARD_RATE: STANDARD_RATE,
    GENERAL_THRESHOLD: GENERAL_THRESHOLD,
    IMPORTER_EXCEPTION_START: IMPORTER_EXCEPTION_START,
    REVIEWED_ON: REVIEWED_ON,
    RATES: RATES,
    EVIDENCE_TYPES: EVIDENCE_TYPES,
    formulaParameters: {
      standard:
        "10% consumption-tax (TC) reference rate in the Ministry fiscal-expenditure report published in 2026",
      reduced:
        "Article 152 exact treatments: 3%, 5%, 7.5%, 25% and 0%; each requires an exact evidence type and explicit confirmation",
      threshold:
        "Article 141: below KMF 20m is exempt, except confirmed importers from KMF 15m to below KMF 20m",
      incomingCallTermination:
        "Article 152 additional tax of KMF 50 per minute on incoming-call termination is a quantity-based levy and is expressly excluded from this amount-based calculator",
    },
    roundingPolicy: { method: "nearest-centime-for-display", precision: 2 },
    resolveRate: resolveRate,
    requireRateEvidence: requireRateEvidence,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    calculateInvoiceTotals: calculateInvoiceTotals,
    classify: classify,
    thresholdScreen: thresholdScreen,
  };
});
