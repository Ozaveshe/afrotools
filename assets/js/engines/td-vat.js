(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.TDVatEngine = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";
  var BASE_STANDARD_RATE = 17.5,
    BASE_REDUCED_RATE = 9,
    CENTIMES_RATE = 10,
    STANDARD_RATE = 19.25,
    REDUCED_RATE = 9.9,
    ZERO_RATE = 0,
    ANNUAL_BOUNDARY = 50000000,
    LARGE_OPERATION_BOUNDARY = 50000000,
    REVIEWED_ON = "2026-07-22";
  function number(v, label) {
    if (v === "" || v === null || typeof v === "undefined")
      throw new RangeError(label + " is required");
    var n = Number(v);
    if (!Number.isFinite(n) || n < 0)
      throw new RangeError(label + " must be a non-negative number");
    return n;
  }
  function roundMoney(v) {
    return Math.round((Number(v) + Number.EPSILON) * 100) / 100;
  }
  function resolveRate(kind) {
    if (kind === "article-238-reduced-confirmed") return REDUCED_RATE;
    if (kind === "article-238-zero-confirmed") return ZERO_RATE;
    if (kind && kind !== "standard")
      throw new RangeError("unsupported rate treatment");
    return STANDARD_RATE;
  }
  function calculate(input) {
    input = input || {};
    var entered = number(input.amount, "amount"),
      mode = input.mode === "extract" ? "extract" : "add",
      rateKind = input.rateKind || "standard",
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
  function calculateInvoice(line, options) {
    line = line || {};
    options = options || {};
    var quantity = number(line.quantity, "quantity"),
      unitPrice = number(line.unitPrice, "unit price"),
      r = calculate({
        amount: roundMoney(quantity * unitPrice),
        rateKind: options.rateKind || "standard",
      });
    return {
      description: String(line.description || ""),
      quantity: quantity,
      unitPrice: unitPrice,
      rateKind: r.rateKind,
      rate: r.rate,
      net: r.net,
      vat: r.vat,
      gross: r.gross,
    };
  }
  function calculateInvoiceTotals(lines) {
    if (!Array.isArray(lines) || !lines.length)
      throw new RangeError("at least one invoice line is required");
    return lines.reduce(
      function (t, line) {
        var r = calculateInvoice(line, {
          rateKind: line.rateKind || "standard",
        });
        t.net = roundMoney(t.net + r.net);
        t.vat = roundMoney(t.vat + r.vat);
        t.gross = roundMoney(t.gross + r.gross);
        return t;
      },
      { net: 0, vat: 0, gross: 0 },
    );
  }
  function classify(key) {
    if (key === "standard")
      return {
        treatment: "standard",
        rate: 19.25,
        note: "Use the effective 19.25% invoice rate: 17.5% base VAT plus provincial and communal centimes equal to 10% of the base VAT.",
      };
    if (key === "article-238-reduced-confirmed")
      return {
        treatment: "reduced",
        rate: 9.9,
        note: "Use the effective 9.9% invoice rate only for the Article 238 scope: 9% base VAT plus centimes equal to 10% of the base VAT.",
      };
    if (key === "article-238-zero-confirmed")
      return {
        treatment: "zero",
        rate: 0,
        note: "Use 0% only for the exports, international transport or qualifying outbound Jet A1 supply listed in Article 238.",
      };
    if (key === "possible-exemption")
      return {
        treatment: "review",
        rate: null,
        note: "An exemption requires the exact current Article 230 condition and, where required, an online DGI exemption certificate.",
      };
    return {
      treatment: "review",
      rate: null,
      note: "Confirm the supply, status and evidence with DGI or a qualified Chad tax adviser.",
    };
  }
  function annualRegimeScreen(turnover, naturalPersonConfirmed) {
    var amount = number(turnover, "turnover");
    if (!naturalPersonConfirmed && amount < ANNUAL_BOUNDARY)
      return {
        status: "legal-form-review",
        threshold: ANNUAL_BOUNDARY,
        determinesRegistration: false,
      };
    return {
      status: amount >= ANNUAL_BOUNDARY ? "vat-regime-review" : "igl-review",
      threshold: ANNUAL_BOUNDARY,
      determinesRegistration: false,
    };
  }
  function largeOperationScreen(amount, iglConfirmed) {
    var value = number(amount, "operation amount");
    if (!iglConfirmed)
      return {
        status: "regime-unconfirmed",
        threshold: LARGE_OPERATION_BOUNDARY,
        determinesLiability: false,
      };
    return {
      status:
        value > LARGE_OPERATION_BOUNDARY
          ? "vat-due-review"
          : "no-large-operation-override",
      threshold: LARGE_OPERATION_BOUNDARY,
      strictlyAbove: true,
      determinesLiability: false,
    };
  }
  return {
    BASE_STANDARD_RATE: BASE_STANDARD_RATE,
    BASE_REDUCED_RATE: BASE_REDUCED_RATE,
    CENTIMES_RATE: CENTIMES_RATE,
    STANDARD_RATE: STANDARD_RATE,
    REDUCED_RATE: REDUCED_RATE,
    ZERO_RATE: ZERO_RATE,
    ANNUAL_BOUNDARY: ANNUAL_BOUNDARY,
    LARGE_OPERATION_BOUNDARY: LARGE_OPERATION_BOUNDARY,
    REVIEWED_ON: REVIEWED_ON,
    reducedScope: [
      "local sugar, oil, soap, textiles and reinforcing steel",
      "local agro-food products and by-products excluding alcohol",
      "equipment for crafts and fishing",
      "restaurant services by real-regime hotels and restaurants",
      "accommodation by approved tourist establishments",
    ],
    formulaParameters: {
      standard:
        "19.25% effective invoice rate: 17.5% base VAT plus 10% centimes on that base VAT",
      reduced:
        "9.9% effective invoice rate: 9% base VAT plus 10% centimes, only for the Article 238 scope",
      centimes:
        "The 2024 application circular requires invoices to show the definitive 19.25% and 9.9% rates; the 2026 circular continues the provincial and communal centimes allocation",
      zero: "0% only for listed exports, international transport and outbound Jet A1 supplies",
      annualBoundary:
        "XAF 50,000,000 requires legal-form and regime review; the CGI wording differs by person and regime",
      largeOperation:
        "2026 Article 229 V override applies only when a confirmed IGL taxpayer performs one operation above, not equal to, XAF 50,000,000",
      roundingBoundary:
        "CGI Article 235 says taxable bases are rounded down to the nearest thousand; this invoice estimator preserves entered cents and flags that filing adjustment for adviser review",
    },
    roundingPolicy: { method: "nearest-centime-for-display", precision: 2 },
    roundMoney: roundMoney,
    resolveRate: resolveRate,
    calculate: calculate,
    calculateInvoice: calculateInvoice,
    calculateInvoiceTotals: calculateInvoiceTotals,
    classify: classify,
    annualRegimeScreen: annualRegimeScreen,
    largeOperationScreen: largeOperationScreen,
  };
});
