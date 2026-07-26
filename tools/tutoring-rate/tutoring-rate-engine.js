(function (root, factory) {
  var api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  root.AfroToolsTutoringRateEngine = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  function number(value) {
    return value === "" || value === null ? NaN : Number(value);
  }

  function calculate(input) {
    var values = {
      targetIncome: number(input.targetIncome),
      monthlyCosts: number(input.monthlyCosts),
      sessionsPerWeek: number(input.sessionsPerWeek),
      weeksPerMonth: number(input.weeksPerMonth),
      lessonMinutes: number(input.lessonMinutes),
      groupSize: number(input.groupSize),
      prepMinutes: number(input.prepMinutes),
      adminMinutes: number(input.adminMinutes),
      travelMinutes: number(input.travelMinutes),
      sessionCost: number(input.sessionCost),
      taxReserve: number(input.taxReserve),
      riskReserve: number(input.riskReserve),
      packageSessions: number(input.packageSessions),
      packageDiscount: number(input.packageDiscount),
      proposedPrice: input.proposedPrice === "" ? null : number(input.proposedPrice)
    };
    var errors = [];
    ["targetIncome", "monthlyCosts", "prepMinutes", "adminMinutes", "travelMinutes", "sessionCost"].forEach(function (key) {
      if (!Number.isFinite(values[key]) || values[key] < 0) errors.push(key + " must be zero or more.");
    });
    ["sessionsPerWeek", "weeksPerMonth", "lessonMinutes"].forEach(function (key) {
      if (!Number.isFinite(values[key]) || values[key] <= 0) errors.push(key + " must be greater than zero.");
    });
    if (!Number.isInteger(values.groupSize) || values.groupSize < 1) errors.push("Group size must be a whole number of at least 1.");
    if (!Number.isInteger(values.packageSessions) || values.packageSessions < 1) errors.push("Package size must be a whole number of at least 1.");
    if (!Number.isFinite(values.taxReserve) || values.taxReserve < 0) errors.push("Tax or savings reserve must be zero or more.");
    if (!Number.isFinite(values.riskReserve) || values.riskReserve < 0) errors.push("Cancellation reserve must be zero or more.");
    if (values.taxReserve + values.riskReserve >= 80) errors.push("Combined reserves must be below 80%.");
    if (!Number.isFinite(values.packageDiscount) || values.packageDiscount < 0 || values.packageDiscount > 50) errors.push("Package discount must be between 0% and 50%.");
    if (values.proposedPrice !== null && (!Number.isFinite(values.proposedPrice) || values.proposedPrice < 0)) errors.push("Proposed price must be zero or more.");
    if (errors.length) return { ok: false, errors: errors };

    var sessionsMonthly = values.sessionsPerWeek * values.weeksPerMonth;
    var variableCostsMonthly = values.sessionCost * sessionsMonthly;
    var needsBeforeReserve = values.targetIncome + values.monthlyCosts + variableCostsMonthly;
    var reserveRate = (values.taxReserve + values.riskReserve) / 100;
    var requiredRevenueMonthly = needsBeforeReserve / (1 - reserveRate);
    var reserveAmountMonthly = requiredRevenueMonthly - needsBeforeReserve;
    var requiredSessionRevenue = requiredRevenueMonthly / sessionsMonthly;
    var perLearnerSession = requiredSessionRevenue / values.groupSize;
    var clientHourlyEquivalent = perLearnerSession / (values.lessonMinutes / 60);
    var workMinutesSession = values.lessonMinutes + values.prepMinutes + values.adminMinutes + values.travelMinutes;
    var workHoursMonthly = sessionsMonthly * workMinutesSession / 60;
    var afterCostAndReserve = requiredRevenueMonthly * (1 - reserveRate) - values.monthlyCosts - variableCostsMonthly;
    var effectiveWorkHourIncome = afterCostAndReserve / workHoursMonthly;
    var packagePrice = perLearnerSession * values.packageSessions * (1 - values.packageDiscount / 100);
    var packageRevenueLoss = perLearnerSession * values.packageSessions - packagePrice;
    var comparison = null;
    if (values.proposedPrice !== null) {
      var proposedMonthlyRevenue = values.proposedPrice * values.groupSize * sessionsMonthly;
      comparison = {
        proposedMonthlyRevenue: proposedMonthlyRevenue,
        monthlyGap: proposedMonthlyRevenue - requiredRevenueMonthly,
        sessionGap: values.proposedPrice - perLearnerSession
      };
    }
    return {
      ok: true,
      input: values,
      sessionsMonthly: sessionsMonthly,
      variableCostsMonthly: variableCostsMonthly,
      needsBeforeReserve: needsBeforeReserve,
      reserveRate: reserveRate,
      reserveAmountMonthly: reserveAmountMonthly,
      requiredRevenueMonthly: requiredRevenueMonthly,
      requiredSessionRevenue: requiredSessionRevenue,
      perLearnerSession: perLearnerSession,
      clientHourlyEquivalent: clientHourlyEquivalent,
      workMinutesSession: workMinutesSession,
      workHoursMonthly: workHoursMonthly,
      effectiveWorkHourIncome: effectiveWorkHourIncome,
      packagePrice: packagePrice,
      packageRevenueLoss: packageRevenueLoss,
      comparison: comparison
    };
  }

  return { calculate: calculate };
});
