(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.TransferPricingPlanner = api;
  }
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  const METHODS = Object.freeze({
    tnmm: Object.freeze({ indicator: "operatingMargin", unit: "percent" }),
    costPlus: Object.freeze({ indicator: "costPlusMarkup", unit: "percent" }),
    resale: Object.freeze({ indicator: "resaleGrossMargin", unit: "percent" }),
    cup: Object.freeze({ indicator: "controlledUnitPrice", unit: "currency" }),
    loan: Object.freeze({ indicator: "appliedInterestRate", unit: "percent" }),
  });

  function fail(message) {
    return { ok: false, error: message };
  }
  function finite(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }
  function round(value, places) {
    const factor = 10 ** places;
    return Math.round((value + Number.EPSILON) * factor) / factor;
  }

  function analyze(input) {
    const method = input && input.method;
    if (!Object.prototype.hasOwnProperty.call(METHODS, method)) return fail("Choose a supported comparison method.");
    if (!String(input.jurisdiction || "").trim()) return fail("Name the jurisdiction whose domestic rules you will verify.");
    if (!String(input.period || "").trim()) return fail("Enter the transaction or tested period.");
    if (!input.scopeConfirmed) return fail("Confirm that the range is user-supplied and not an AfroTools benchmark.");
    if (!String(input.comparableSource || "").trim()) return fail("Describe the source and period of the comparable range.");

    const amountA = finite(input.amountA);
    const amountB = finite(input.amountB);
    const low = finite(input.rangeLow);
    const median = finite(input.rangeMedian);
    const high = finite(input.rangeHigh);
    if (amountA === null || amountA <= 0) return fail("Enter a positive primary amount.");
    if (amountB === null || amountB < 0) return fail("Enter a valid secondary amount.");
    if ([low, median, high].some((value) => value === null)) return fail("Enter the low, median and high values from your comparable source.");
    if (!(low <= median && median <= high)) return fail("Comparable values must be ordered low, median, then high.");

    let indicator;
    if (method === "tnmm" || method === "resale") {
      indicator = (amountA - amountB) / amountA * 100;
    } else if (method === "costPlus") {
      if (amountB === 0) return fail("Cost base must be greater than zero for cost plus.");
      indicator = (amountA - amountB) / amountB * 100;
    } else if (method === "cup") {
      indicator = amountA;
    } else {
      indicator = amountB;
    }

    const status = indicator < low ? "below" : indicator > high ? "above" : "inside";
    const differenceToMedian = indicator - median;
    return {
      ok: true,
      method,
      indicator: round(indicator, 4),
      indicatorName: METHODS[method].indicator,
      unit: METHODS[method].unit,
      range: { low, median, high },
      status,
      differenceToMedian: round(differenceToMedian, 4),
      comparableSource: String(input.comparableSource).trim(),
      calculatorVersion: "tp-comparability-planner-2026",
      sourceVersion: "oecd-2022-amount-b-2024-ataf-reviewed-2026-07-22",
      dataAsOf: "2026-07-22",
    };
  }
  return { METHODS, analyze };
});
