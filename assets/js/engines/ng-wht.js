(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.AfroNgWht = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MATRIX = {
    dividend: { corporate: { resident: 10, nonresident: 10 }, noncorporate: { resident: 10, nonresident: 10 } },
    interest: { corporate: { resident: 10, nonresident: 10 }, noncorporate: { resident: 10, nonresident: 10 } },
    royalty: { corporate: { resident: 10, nonresident: 10 }, noncorporate: { resident: 5, nonresident: 5 } },
    rent: { corporate: { resident: 10, nonresident: 10 }, noncorporate: { resident: 10, nonresident: 10 } },
    professional: { corporate: { resident: 5, nonresident: 10 }, noncorporate: { resident: 5, nonresident: 10 } },
    goods: { corporate: { resident: 2, nonresident: null }, noncorporate: { resident: 2, nonresident: null } },
    tower: { corporate: { resident: 2, nonresident: 5 }, noncorporate: { resident: 2, nonresident: 5 } },
    services: { corporate: { resident: 2, nonresident: 5 }, noncorporate: { resident: 2, nonresident: 5 } },
    specifiedConstruction: { corporate: { resident: 2, nonresident: 5 }, noncorporate: { resident: 2, nonresident: 5 } },
    otherConstruction: { corporate: { resident: 5, nonresident: 10 }, noncorporate: { resident: 5, nonresident: 10 } },
    brokerage: { corporate: { resident: 5, nonresident: 10 }, noncorporate: { resident: 5, nonresident: 10 } },
    directorsFees: { corporate: { resident: null, nonresident: null }, noncorporate: { resident: 15, nonresident: 20 } },
    winnings: { corporate: { resident: null, nonresident: null }, noncorporate: { resident: 5, nonresident: 15 } },
  };

  var NON_PASSIVE = [
    "professional",
    "goods",
    "tower",
    "services",
    "specifiedConstruction",
    "otherConstruction",
    "brokerage",
  ];

  function choice(value, allowed, name) {
    var normalized = String(value || "");
    if (allowed.indexOf(normalized) === -1) {
      throw new RangeError(name + " is not supported");
    }
    return normalized;
  }

  function amount(value) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0) {
      throw new RangeError("grossAmount must be zero or more");
    }
    return number;
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function transactionDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      throw new TypeError("transactionDate must be a valid date");
    }
    var date = new Date(String(value) + "T00:00:00Z");
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
      throw new TypeError("transactionDate must be a valid date");
    }
    if (value < "2026-01-01") {
      throw new RangeError("transactionDate must be on or after 1 January 2026");
    }
    return value;
  }

  function calculate(raw) {
    var input = raw || {};
    if (input.scopeConfirmed !== true) throw new Error("scope confirmation is required");

    var transactionType = choice(input.transactionType, Object.keys(MATRIX), "transactionType");
    var recipientClass = choice(input.recipientClass, ["corporate", "noncorporate"], "recipientClass");
    var residency = choice(input.residency, ["resident", "nonresident"], "residency");
    var treatment = choice(input.treatment || "schedule", ["schedule", "treaty", "exempt"], "treatment");
    var grossAmount = amount(input.grossAmount);
    var date = transactionDate(input.transactionDate);
    var scheduleRate = MATRIX[transactionType][recipientClass][residency];
    if (scheduleRate === null) {
      throw new Error("no schedule rate for this transaction and recipient combination");
    }

    var nonPassive = NON_PASSIVE.indexOf(transactionType) !== -1;
    var doubledForMissingTaxId = false;
    var appliedRate = scheduleRate;

    if (treatment === "schedule" && nonPassive && input.taxIdAvailable !== true) {
      appliedRate = scheduleRate * 2;
      doubledForMissingTaxId = true;
    }

    if (treatment === "treaty") {
      if (residency !== "nonresident") throw new Error("treaty treatment requires a non-resident recipient");
      if (input.documentationConfirmed !== true) throw new Error("documentation confirmation is required");
      appliedRate = Number(input.treatyRatePercent);
      if (!Number.isFinite(appliedRate) || appliedRate < 0 || appliedRate >= scheduleRate) {
        throw new RangeError("treatyRatePercent must be at least 0 and below the schedule rate");
      }
    }

    if (treatment === "exempt") {
      if (input.documentationConfirmed !== true) throw new Error("documentation confirmation is required");
      appliedRate = 0;
    }

    var deduction = roundMoney(grossAmount * appliedRate / 100);
    return {
      calculatorVersion: "ng-wht-2026",
      sourceVersion: "deduction-at-source-regulations-2024-jrb-2026",
      transactionType: transactionType,
      recipientClass: recipientClass,
      residency: residency,
      treatment: treatment,
      grossAmount: grossAmount,
      transactionDate: date,
      scheduleRatePercent: scheduleRate,
      appliedRatePercent: appliedRate,
      doubledForMissingTaxId: doubledForMissingTaxId,
      deduction: deduction,
      netPayment: roundMoney(grossAmount - deduction),
      nonResidentFinalTaxCandidate: residency === "nonresident" && ["dividend", "interest", "rent", "royalty"].indexOf(transactionType) !== -1,
    };
  }

  return {
    MATRIX: MATRIX,
    NON_PASSIVE: NON_PASSIVE.slice(),
    calculate: calculate,
  };
});
