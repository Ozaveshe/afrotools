(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.CMVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var BASE_RATE = 17.5;
  var CAC_ON_BASE_RATE = 10;
  var STANDARD_RATE = 19.25;
  var SOCIAL_HOUSING_RATE = 10;
  var REAL_REGIME_TURNOVER_THRESHOLD = 50000000;
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

  function roundMoney(value) {
    return Math.round((Number(value) + Number.EPSILON) * 100) / 100;
  }

  function resolveRate(rateKind) {
    if (rateKind === "social-housing") return SOCIAL_HOUSING_RATE;
    if (rateKind === "confirmed-zero") return 0;
    if (rateKind && rateKind !== "standard") {
      throw new RangeError("unsupported rate treatment");
    }
    return STANDARD_RATE;
  }

  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount");
    var mode = input.mode === "extract" ? "extract" : "add";
    var rateKind = input.rateKind || "standard";
    var rate = resolveRate(rateKind);
    var net = mode === "extract" ? entered / (1 + rate / 100) : entered;
    var vat = (net * rate) / 100;
    var gross = mode === "extract" ? entered : net + vat;
    return {
      mode: mode,
      rateKind: rateKind,
      rate: rate,
      net: roundMoney(net),
      vat: roundMoney(vat),
      gross: roundMoney(gross),
    };
  }

  function calculateInvoice(line, options) {
    line = line || {};
    options = options || {};
    var quantity = number(line.quantity, "quantity");
    var unitPrice = number(line.unitPrice, "unit price");
    var net = roundMoney(quantity * unitPrice);
    var result = calculate({
      amount: net,
      rateKind: options.rateKind || "standard",
    });
    return {
      description: String(line.description || ""),
      quantity: quantity,
      unitPrice: unitPrice,
      rateKind: result.rateKind,
      rate: result.rate,
      net: result.net,
      vat: result.vat,
      gross: result.gross,
    };
  }

  function calculateWithholding(result, authorizedBuyerConfirmed) {
    if (!result || typeof result.vat === "undefined") {
      throw new TypeError("a VAT result is required");
    }
    if (!authorizedBuyerConfirmed) {
      return {
        status: "not-confirmed",
        withheldVat: 0,
        supplierReceives: roundMoney(result.gross),
        supplierVatToRemitFromThisInvoice: roundMoney(result.vat),
      };
    }
    return {
      status: "full-vat-withholding",
      withheldVat: roundMoney(result.vat),
      supplierReceives: roundMoney(result.net),
      supplierVatToRemitFromThisInvoice: 0,
    };
  }

  function classify(key) {
    if (key === "standard") {
      return {
        treatment: "standard",
        rate: STANDARD_RATE,
        source: "DGI 2026 withholding order confirms the 19.25% VAT rate.",
      };
    }
    if (key === "social-housing") {
      return {
        treatment: "reduced",
        rate: SOCIAL_HOUSING_RATE,
        source:
          "MINFI 2026 material limits the 10% rate to qualifying social-housing operations.",
      };
    }
    if (key === "confirmed-zero") {
      return {
        treatment: "zero",
        rate: 0,
        source:
          "Use 0% only after matching the supply to a current statutory zero-rate provision.",
      };
    }
    if (key === "confirmed-exempt") {
      return {
        treatment: "exempt",
        rate: null,
        source:
          "An exempt supply is not a zero-rated supply; confirm the current statutory exemption.",
      };
    }
    return {
      treatment: "review",
      rate: null,
      source:
        "Confirm classification, invoice evidence and recoverability with DGI or a qualified adviser.",
    };
  }

  function registrationScreen(turnover) {
    var amount = number(turnover, "turnover");
    return {
      status:
        amount >= REAL_REGIME_TURNOVER_THRESHOLD
          ? "review-real-regime"
          : "review-igs-regime",
      threshold: REAL_REGIME_TURNOVER_THRESHOLD,
      determinesRegistration: false,
    };
  }

  return {
    BASE_RATE: BASE_RATE,
    CAC_ON_BASE_RATE: CAC_ON_BASE_RATE,
    STANDARD_RATE: STANDARD_RATE,
    SOCIAL_HOUSING_RATE: SOCIAL_HOUSING_RATE,
    REAL_REGIME_TURNOVER_THRESHOLD: REAL_REGIME_TURNOVER_THRESHOLD,
    REVIEWED_ON: REVIEWED_ON,
    formulaParameters: {
      standardRate:
        "17.5% base VAT plus communal additional tax equal to 10% of base VAT = 19.25% effective",
      socialHousing:
        "10% reduced VAT for qualifying 2026 social-housing acquisition, sale or rental operations described by MINFI",
      withholding:
        "full VAT withholding only when the buyer is authorized under the current DGI list; system-generated withholding certificate required",
      filingBoundary:
        "this tool estimates invoice VAT and does not determine registration, return, deduction or payment eligibility",
      turnoverBoundary:
        "XAF 50,000,000 is the exact boundary between the IGS turnover range below the threshold and the real-regime review path; it is not an automatic VAT-registration verdict",
    },
    roundingPolicy: {
      method: "nearest-centime-for-display",
      precision: 2,
      stages: [
        "Calculate from the unrounded entered amount",
        "Round displayed net, VAT and gross outputs to two decimal places",
      ],
    },
    roundMoney: roundMoney,
    resolveRate: resolveRate,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    calculateWithholding: calculateWithholding,
    classify: classify,
    registrationScreen: registrationScreen,
  };
});
