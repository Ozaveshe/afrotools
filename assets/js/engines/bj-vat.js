(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.BJVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 18;
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
    if (input.rateKind === "export") return 0;
    if (input.rateKind === "scenario") return rate(input.rate);
    return STANDARD_RATE;
  }

  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount");
    var mode = input.mode === "extract" ? "extract" : "add";
    var rateKind =
      input.rateKind === "export"
        ? "export"
        : input.rateKind === "scenario"
          ? "scenario"
          : "standard";
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

  function calculateInvoice(lines) {
    if (!Array.isArray(lines) || !lines.length) {
      throw new RangeError("at least one invoice line is required");
    }
    var normalized = lines.map(function (line) {
      var quantity = number(line.quantity, "quantity");
      var unitPrice = number(line.unitPrice, "unit price");
      var usedRate = rate(
        typeof line.rate === "undefined" ? STANDARD_RATE : line.rate,
      );
      var net = roundMoney(quantity * unitPrice);
      return {
        description: String(line.description || ""),
        quantity: quantity,
        unitPrice: unitPrice,
        rate: usedRate,
        net: net,
        vat: roundMoney((net * usedRate) / 100),
      };
    });
    var net = roundMoney(
      normalized.reduce(function (sum, line) {
        return sum + line.net;
      }, 0),
    );
    var vat = roundMoney(
      normalized.reduce(function (sum, line) {
        return sum + line.vat;
      }, 0),
    );
    return {
      lines: normalized,
      net: net,
      vat: vat,
      gross: roundMoney(net + vat),
      effectiveRate: net ? roundMoney((vat / net) * 100) : 0,
    };
  }

  function classify(key) {
    if (key === "standard") {
      return {
        treatment: "standard",
        rate: STANDARD_RATE,
        source: "Benin CGI 2023, article 241: VAT is fixed at 18%",
      };
    }
    if (key === "confirmed-export") {
      return {
        treatment: "export",
        rate: 0,
        source: "DGI VAT guide: taxable exports use the zero-rate convention",
      };
    }
    if (key === "confirmed-exempt") {
      return {
        treatment: "exempt",
        rate: null,
        source: "Confirm the operation against current CGI article 229",
      };
    }
    return {
      treatment: "review",
      rate: null,
      source:
        "Confirm classification, any current Finance Act measure, and the applicable DGI treatment",
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    REVIEWED_ON: REVIEWED_ON,
    formulaParameters: {
      standardRatePercent: STANDARD_RATE,
      exportTreatment: "confirmation-only zero-rate convention",
      exemptionTreatment: "confirmation-only CGI article 229",
      filingDeadline: "10th of the following month under CGI article 259",
    },
    roundingPolicy: {
      method: "nearest-centime",
      precision: 2,
      stages: [
        "Round each invoice line net and VAT amount before aggregation",
        "Round displayed net, VAT and gross outputs to two decimal places",
      ],
    },
    roundMoney: roundMoney,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    classify: classify,
  };
});
