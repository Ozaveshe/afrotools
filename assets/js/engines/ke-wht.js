(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.KenyaWht = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const RATES = Object.freeze({
    dividend: Object.freeze({ resident: 10, nonresident: 15 }),
    interest: Object.freeze({ resident: 15, nonresident: 15 }),
    royalty: Object.freeze({ resident: 5, nonresident: 20 }),
    management: Object.freeze({ resident: 5, nonresident: 20, residentThreshold: 24000 }),
    professional: Object.freeze({ resident: 5, nonresident: 20, residentThreshold: 24000 }),
    training: Object.freeze({ resident: 5, nonresident: 20, residentThreshold: 24000 }),
    consultancy: Object.freeze({ resident: 5, nonresident: 20, residentThreshold: 24000 }),
    contractual: Object.freeze({ resident: 3, nonresident: 20, residentThreshold: 24000 }),
    immovableRent: Object.freeze({ resident: 10, nonresident: 30 }),
    residentialRent: Object.freeze({ resident: 7.5, nonresident: 30, evidenceRequired: true }),
    movableRent: Object.freeze({ resident: null, nonresident: 15 }),
    winnings: Object.freeze({ resident: 20, nonresident: 20 }),
    sportsEntertainment: Object.freeze({ resident: 5, nonresident: 20 }),
    publicGoods: Object.freeze({ resident: 0.5, nonresident: 5, evidenceRequired: true }),
  });

  function fail(message) {
    return { ok: false, error: message };
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    const amount = Number(input && input.grossAmount);
    const paymentType = input && input.paymentType;
    const residency = input && input.residency;
    const treatment = (input && input.treatment) || "standard";
    const evidenceConfirmed = Boolean(input && input.evidenceConfirmed);
    const scopeConfirmed = Boolean(input && input.scopeConfirmed);

    if (!scopeConfirmed) return fail("Confirm that this is a Kenyan withholding-tax payment before calculating.");
    if (!Number.isFinite(amount) || amount <= 0) return fail("Enter a gross payment greater than zero.");
    if (!Object.prototype.hasOwnProperty.call(RATES, paymentType)) return fail("Choose a supported payment category.");
    if (residency !== "resident" && residency !== "nonresident") return fail("Choose the recipient residency.");

    const row = RATES[paymentType];
    const scheduleRate = row[residency];
    if (!Number.isFinite(scheduleRate)) {
      return fail("This resident/non-resident combination has no general rate in the reviewed KRA table.");
    }
    if (row.evidenceRequired && !evidenceConfirmed) {
      return fail(paymentType === "publicGoods"
        ? "Confirm that the payer is a public entity before applying the public-goods rate."
        : "Confirm eligibility for the residential Monthly Rental Income flow before applying 7.5%.");
    }
    if (residency === "resident" && row.residentThreshold && amount < row.residentThreshold) {
      return fail("The reviewed resident fee threshold is KSh 24,000 in aggregate for the month; this payment is below it.");
    }

    let rate = scheduleRate;
    let treatmentLabel = "standard";
    const notes = [];

    if (treatment === "eac") {
      if (!evidenceConfirmed) return fail("Confirm EAC citizenship evidence before applying an EAC rate.");
      if (residency !== "nonresident") return fail("The supported EAC reductions apply to a non-resident recipient.");
      if (paymentType === "dividend") rate = 5;
      else if (paymentType === "consultancy") rate = 15;
      else return fail("The reviewed KRA table does not provide an EAC reduction for this payment category.");
      treatmentLabel = "EAC";
      notes.push("EAC reduction applied from the KRA table; retain citizenship evidence.");
    } else if (treatment === "treaty") {
      const treatyRate = Number(input && input.treatyRatePercent);
      if (residency !== "nonresident") return fail("Treaty-rate entry is restricted to non-resident recipients.");
      if (!evidenceConfirmed) return fail("Confirm treaty eligibility and documentation before using a reduced rate.");
      if (!Number.isFinite(treatyRate) || treatyRate < 0 || treatyRate >= scheduleRate) {
        return fail("Enter an evidenced treaty rate below the standard non-resident rate.");
      }
      rate = treatyRate;
      treatmentLabel = "treaty";
      notes.push("User-supplied treaty rate applied; this calculator does not determine treaty eligibility.");
    } else if (treatment === "controllingDividend") {
      if (paymentType !== "dividend" || residency !== "resident") {
        return fail("The supported controlling-company dividend exemption requires a resident dividend.");
      }
      if (!evidenceConfirmed) return fail("Confirm resident-company voting-power evidence before applying the dividend exemption.");
      rate = 0;
      treatmentLabel = "controlling resident-company dividend exemption";
      notes.push("Evidence-confirmed exemption applied for a resident corporate shareholder with more than 12.5% voting power.");
    } else if (treatment !== "standard") {
      return fail("Choose a supported withholding treatment.");
    }

    const deduction = roundMoney(amount * rate / 100);
    return {
      ok: true,
      grossAmount: roundMoney(amount),
      deduction,
      netPayment: roundMoney(amount - deduction),
      rate,
      scheduleRate,
      paymentType,
      residency,
      treatment: treatmentLabel,
      notes,
      calculatorVersion: "ke-wht-2026",
      sourceVersion: "kra-income-tax-act-reviewed-2026-07-22",
      dataAsOf: "2026-07-22",
    };
  }

  return { RATES, calculate };
});
