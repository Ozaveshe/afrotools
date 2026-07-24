(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AfroZaDividendTax = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var STANDARD_RATE = 0.2;
  var RATE_EFFECTIVE_FROM = "2017-02-22";

  function finiteNumber(value, name) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new TypeError(name + " must be a number");
    return number;
  }

  function nonNegative(value, name) {
    var number = finiteNumber(value, name);
    if (number < 0) throw new RangeError(name + " must be zero or more");
    return number;
  }

  function paymentCount(value) {
    var count = finiteNumber(value, "paymentCount");
    if (!Number.isInteger(count) || count < 1 || count > 365) {
      throw new RangeError("paymentCount must be a whole number from 1 to 365");
    }
    return count;
  }

  function validDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      throw new TypeError("paymentDate must be a valid date");
    }
    var date = new Date(String(value) + "T00:00:00Z");
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new TypeError("paymentDate must be a valid date");
    }
    if (value < RATE_EFFECTIVE_FROM) {
      throw new RangeError("paymentDate must be on or after 22 February 2017");
    }
    return date;
  }

  function endOfFollowingMonth(date) {
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 2, 0))
      .toISOString()
      .slice(0, 10);
  }

  function money(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(raw) {
    var input = raw || {};
    if (input.scopeConfirmed !== true) {
      throw new Error("scope confirmation is required");
    }

    var grossDividend = nonNegative(input.grossDividend, "grossDividend");
    var count = paymentCount(input.paymentCount);
    var date = validDate(input.paymentDate);
    var treatment = String(input.treatment || "standard");
    if (["standard", "reduced", "exempt"].indexOf(treatment) === -1) {
      throw new RangeError("treatment must be standard, reduced or exempt");
    }

    var rate = STANDARD_RATE;
    if (treatment === "reduced") {
      var percent = finiteNumber(input.reducedRatePercent, "reducedRatePercent");
      if (percent < 0 || percent >= STANDARD_RATE * 100) {
        throw new RangeError("reducedRatePercent must be at least 0 and below 20");
      }
      rate = percent / 100;
    } else if (treatment === "exempt") {
      rate = 0;
    }

    if (treatment !== "standard" && input.documentationConfirmed !== true) {
      throw new Error("documentation confirmation is required");
    }

    var taxPerPayment = money(grossDividend * rate);
    var netPerPayment = money(grossDividend - taxPerPayment);
    var scenarioGross = money(grossDividend * count);
    var scenarioTax = money(taxPerPayment * count);
    var scenarioNet = money(netPerPayment * count);

    return {
      sourceVersion: "sars-reviewed-2026-07-22",
      calculatorVersion: "sars-dividends-tax-2026",
      grossDividend: grossDividend,
      paymentCount: count,
      paymentDate: input.paymentDate,
      indicativeRemittanceDate: endOfFollowingMonth(date),
      treatment: treatment,
      rate: rate,
      taxPerPayment: taxPerPayment,
      netPerPayment: netPerPayment,
      scenarioGross: scenarioGross,
      scenarioTax: scenarioTax,
      scenarioNet: scenarioNet,
    };
  }

  return {
    STANDARD_RATE: STANDARD_RATE,
    RATE_EFFECTIVE_FROM: RATE_EFFECTIVE_FROM,
    calculate: calculate,
  };
});
