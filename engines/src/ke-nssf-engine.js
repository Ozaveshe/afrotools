(function (global) {
  "use strict";

  var RULES = Object.freeze({
    scheme: "NSSF Year 4 (2026)",
    effectiveFrom: "2026-02-01",
    verifiedThrough: "2026-07-23",
    lowerEarningsLimit: 9000,
    upperEarningsLimit: 108000,
    employeeRate: 0.06,
    employerRate: 0.06,
    remittanceDay: 9,
    source: "NSSF Kenya Notice to Employers - Year 4 (2026)"
  });

  function number(value) {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  }

  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(raw) {
    raw = raw || {};
    var earnings = number(raw.monthlyPensionableEarnings);
    var employeeActual = number(raw.employeeActual);
    var employerActual = number(raw.employerActual);
    var period = String(raw.contributionPeriod || "");

    if (!Number.isFinite(earnings) || earnings <= 0 || earnings > 1e15) return { ok: false, error: "invalid_earnings" };
    if (!/^\d{4}-\d{2}$/.test(period) || period < "2026-02" || period > "2026-07") return { ok: false, error: "unsupported_period" };
    if ((employeeActual !== null && (!Number.isFinite(employeeActual) || employeeActual < 0 || employeeActual > 1e15)) || (employerActual !== null && (!Number.isFinite(employerActual) || employerActual < 0 || employerActual > 1e15))) return { ok: false, error: "invalid_actual" };

    var pensionable = Math.min(earnings, RULES.upperEarningsLimit);
    var tier1Base = Math.min(pensionable, RULES.lowerEarningsLimit);
    var tier2Base = Math.max(0, pensionable - tier1Base);
    var tier1Employee = round(tier1Base * RULES.employeeRate);
    var tier2Employee = round(tier2Base * RULES.employeeRate);
    var employeeExpected = round(tier1Employee + tier2Employee);
    var employerExpected = employeeExpected;

    return {
      ok: true,
      contributionPeriod: period,
      monthlyPensionableEarnings: round(earnings),
      cappedPensionableEarnings: round(pensionable),
      earningsAboveUpperLimit: round(Math.max(0, earnings - RULES.upperEarningsLimit)),
      tier1Base: round(tier1Base),
      tier2Base: round(tier2Base),
      tier1Employee: tier1Employee,
      tier2Employee: tier2Employee,
      tier1Employer: tier1Employee,
      tier2Employer: tier2Employee,
      employeeExpected: employeeExpected,
      employerExpected: employerExpected,
      combinedExpected: round(employeeExpected + employerExpected),
      annualCombinedExpected: round((employeeExpected + employerExpected) * 12),
      employeeActual: employeeActual,
      employerActual: employerActual,
      employeeVariance: employeeActual === null ? null : round(employeeActual - employeeExpected),
      employerVariance: employerActual === null ? null : round(employerActual - employerExpected),
      rules: RULES,
      boundary: "Contribution arithmetic only. NSSF determines balances, credited returns, eligibility and benefits."
    };
  }

  var api = { RULES: RULES, calculate: calculate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.KE_NSSF = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
