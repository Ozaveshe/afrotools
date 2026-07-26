(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.helbEngine = api;
  }
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const MAX_MONTHS = 600;

  function number(value) {
    if (value === "" || value === null || value === undefined) return NaN;
    return Number(value);
  }

  function validate(input) {
    const balance = number(input.balance);
    const annualRate = number(input.annualRate);
    const monthlyPayment = number(input.monthlyPayment);
    const extraPayment = number(input.extraPayment || 0);

    if (!Number.isFinite(balance) || balance <= 0) {
      return { valid: false, error: "Enter a current statement balance greater than zero." };
    }
    if (!Number.isFinite(annualRate) || annualRate < 0 || annualRate > 50) {
      return { valid: false, error: "Enter an annual interest rate from 0% to 50%." };
    }
    if (!Number.isFinite(monthlyPayment) || monthlyPayment <= 0) {
      return { valid: false, error: "Enter the monthly deduction or direct payment you plan to make." };
    }
    if (!Number.isFinite(extraPayment) || extraPayment < 0) {
      return { valid: false, error: "Extra payment cannot be negative." };
    }
    if (monthlyPayment + extraPayment > 100000000) {
      return { valid: false, error: "The monthly payment is outside this planner's supported range." };
    }
    return { valid: true, values: { balance, annualRate, monthlyPayment, extraPayment } };
  }

  function calculate(input) {
    const checked = validate(input);
    if (!checked.valid) return checked;

    const { balance: openingBalance, annualRate, monthlyPayment, extraPayment } = checked.values;
    const plannedPayment = monthlyPayment + extraPayment;
    const monthlyRate = annualRate / 100 / 12;
    const firstMonthInterest = openingBalance * monthlyRate;

    if (plannedPayment <= firstMonthInterest && monthlyRate > 0) {
      return {
        valid: true,
        clears: false,
        reason: "payment_below_interest",
        openingBalance,
        annualRate,
        plannedPayment,
        firstMonthInterest,
        schedule: []
      };
    }

    let balance = openingBalance;
    let totalInterest = 0;
    let totalPaid = 0;
    const schedule = [];
    let months = 0;

    while (balance > 0.005 && months < MAX_MONTHS) {
      months += 1;
      const interest = balance * monthlyRate;
      const due = balance + interest;
      const payment = Math.min(plannedPayment, due);
      const principal = Math.max(0, payment - interest);
      balance = Math.max(0, due - payment);
      totalInterest += interest;
      totalPaid += payment;

      if (months <= 24) {
        schedule.push({ month: months, payment, interest, principal, balance });
      }
    }

    return {
      valid: true,
      clears: balance <= 0.005,
      reason: balance <= 0.005 ? "clears" : "over_50_years",
      openingBalance,
      annualRate,
      plannedPayment,
      firstMonthInterest,
      months,
      totalInterest,
      totalPaid,
      remainingBalance: balance,
      schedule
    };
  }

  return { MAX_MONTHS, validate, calculate };
});
