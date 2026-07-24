(function (global) {
  "use strict";

  var RULES = Object.freeze({
    scheme: "GEPF two-pot retirement estimate",
    twoPotEffectiveFrom: "2024-09-01",
    verifiedThrough: "2026-07-23",
    memberContributionRate: 0.075,
    employerOtherRate: 0.13,
    employerServicesRate: 0.16,
    vestedGratuityFactor: 0.0672,
    savingsGratuityFactorOther: 3 * 0.0775,
    savingsGratuityFactorServices: 3 * 0.0845,
    vestedAnnuityFactor: 1 / 55,
    retirementAnnuityFactorOther: 1.5 / 58.65,
    retirementAnnuityFactorServices: 1.5 / 60.71,
    annualSupplement: 360,
    normalRetirementAge: 60,
    earlyReductionPerMonth: 1 / 300,
    minimumVestedService: 10,
    source: "Government Employees Pension Fund official benefits and two-pot guidance"
  });

  function number(value) {
    if (value === "" || value === null || value === undefined) return null;
    return Number(value);
  }

  function round(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function validMoney(value) {
    return Number.isFinite(value) && value > 0 && value <= 1e15;
  }

  function validService(value) {
    return Number.isFinite(value) && value >= 0 && value <= 60;
  }

  function calculate(raw) {
    raw = raw || {};
    var finalAnnualSalary = number(raw.finalAnnualSalary);
    var vestedService = number(raw.vestedService);
    var savingsService = number(raw.savingsService);
    var retirementService = number(raw.retirementService);
    var retirementAge = number(raw.retirementAge);
    var earlyBasis = String(raw.earlyBasis || "standard");
    var employerType = String(raw.employerType || "other");

    if (!validMoney(finalAnnualSalary)) return { ok: false, error: "invalid_salary" };
    if (![vestedService, savingsService, retirementService].every(validService)) return { ok: false, error: "invalid_service" };
    if (!Number.isFinite(retirementAge) || retirementAge < 55 || retirementAge > 75) return { ok: false, error: "invalid_age" };
    if (earlyBasis !== "standard" && earlyBasis !== "approved") return { ok: false, error: "invalid_basis" };
    if (employerType !== "other" && employerType !== "services") return { ok: false, error: "invalid_employer" };

    var totalService = vestedService + savingsService + retirementService;
    if (vestedService < RULES.minimumVestedService) {
      return { ok: false, error: "under_ten_vested", totalService: round(totalService) };
    }

    var monthsEarly = retirementAge < RULES.normalRetirementAge ? Math.round((RULES.normalRetirementAge - retirementAge) * 12) : 0;
    var reductionRate = monthsEarly && earlyBasis === "standard" ? Math.min(1, monthsEarly * RULES.earlyReductionPerMonth) : 0;
    var reductionFactor = 1 - reductionRate;
    var savingsGratuityFactor = employerType === "services" ? RULES.savingsGratuityFactorServices : RULES.savingsGratuityFactorOther;
    var retirementAnnuityFactor = employerType === "services" ? RULES.retirementAnnuityFactorServices : RULES.retirementAnnuityFactorOther;
    var vestedGratuity = finalAnnualSalary * vestedService * RULES.vestedGratuityFactor;
    var savingsGratuity = finalAnnualSalary * savingsService * savingsGratuityFactor;
    var vestedAnnuity = finalAnnualSalary * vestedService * RULES.vestedAnnuityFactor;
    var retirementAnnuity = finalAnnualSalary * retirementService * retirementAnnuityFactor;
    var annualAnnuityBeforeReduction = vestedAnnuity + retirementAnnuity + RULES.annualSupplement;
    var monthlyPensionableSalary = finalAnnualSalary / 12;
    var employerRate = employerType === "services" ? RULES.employerServicesRate : RULES.employerOtherRate;

    return {
      ok: true,
      finalAnnualSalary: round(finalAnnualSalary),
      monthlyPensionableSalary: round(monthlyPensionableSalary),
      vestedService: round(vestedService),
      savingsService: round(savingsService),
      retirementService: round(retirementService),
      totalService: round(totalService),
      retirementAge: retirementAge,
      earlyBasis: earlyBasis,
      monthsEarly: monthsEarly,
      reductionRate: reductionRate,
      vestedGratuityBeforeReduction: round(vestedGratuity),
      savingsGratuityBeforeReduction: round(savingsGratuity),
      gratuityBeforeReduction: round(vestedGratuity + savingsGratuity),
      gratuityEstimate: round((vestedGratuity + savingsGratuity) * reductionFactor),
      vestedAnnualAnnuityBeforeReduction: round(vestedAnnuity),
      retirementAnnualAnnuityBeforeReduction: round(retirementAnnuity),
      annualAnnuityBeforeReduction: round(annualAnnuityBeforeReduction),
      annualAnnuityEstimate: round(annualAnnuityBeforeReduction * reductionFactor),
      monthlyAnnuityEstimate: round(annualAnnuityBeforeReduction * reductionFactor / 12),
      memberMonthlyContribution: round(monthlyPensionableSalary * RULES.memberContributionRate),
      employerMonthlyContribution: round(monthlyPensionableSalary * employerRate),
      employerRate: employerRate,
      savingsGratuityFactor: savingsGratuityFactor,
      retirementAnnuityFactor: retirementAnnuityFactor,
      rules: RULES,
      boundary: "Planning estimate for retirement with at least 10 years of vested service. GEPF determines service records, actuarial factors, tax, early-retirement treatment and final benefits."
    };
  }

  var api = { RULES: RULES, calculate: calculate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  global.ZA_GEPF = api;
})(typeof globalThis !== "undefined" ? globalThis : this);
