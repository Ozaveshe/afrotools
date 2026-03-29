// /engines/hr-engine.js
// HR & Payroll calculation engine for AfroTools Phase 1
// Tools: Minimum Wage, Overtime, Leave/PTO, Social Security, Pension
// Depends on: /data/hr/*.js (loaded before this script)

(function () {
  "use strict";
  window.AfroTools = window.AfroTools || {};

  // Currency formatting helper
  var CURRENCY_SYMBOLS = {
    NGN: "\u20A6", KES: "KES ", ZAR: "R", GHS: "GHS ", EGP: "EGP ", TZS: "TZS ", UGX: "UGX ",
    RWF: "RWF ", XOF: "FCFA ", XAF: "FCFA ", MAD: "MAD ", TND: "TND ", AOA: "Kz ",
    ZMW: "ZMW ", ZWG: "ZWG ", MUR: "MUR ", BWP: "BWP ", NAD: "N$", MWK: "MWK ",
    MZN: "MZN ", MGA: "MGA ", LSL: "LSL ", SZL: "SZL ", GNF: "GNF ", SLE: "SLE ",
    LRD: "LRD ", GMD: "GMD ", CVE: "CVE ", MRU: "MRU ", DJF: "DJF ", KMF: "KMF ",
    SCR: "SCR ", SOS: "SOS ", SDG: "SDG ", SSP: "SSP ", LYD: "LYD ", DZD: "DZD ",
    ETB: "ETB ", BIF: "BIF ", ERN: "ERN ", CDF: "CDF ", STN: "STN "
  };

  function fmt(value, currency) {
    if (value == null || isNaN(value)) return "\u2014";
    var sym = CURRENCY_SYMBOLS[currency] || currency + " ";
    return sym + Number(value).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function fmtNum(value) {
    if (value == null || isNaN(value)) return "\u2014";
    return Number(value).toLocaleString("en", { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  function getAllCountryCodes() {
    if (typeof MINIMUM_WAGES === "undefined") return [];
    return Object.keys(MINIMUM_WAGES).sort(function (a, b) {
      return MINIMUM_WAGES[a].name.localeCompare(MINIMUM_WAGES[b].name);
    });
  }

  // ── Minimum Wage ──────────────────────────────────────
  function getMinimumWage(cc) {
    if (typeof MINIMUM_WAGES === "undefined" || !MINIMUM_WAGES[cc]) return null;
    var d = MINIMUM_WAGES[cc];
    var m = d.nationalMinimum || {};
    return {
      country: d.name,
      flag: d.flag,
      currency: d.currency,
      symbol: CURRENCY_SYMBOLS[d.currency] || d.currency + " ",
      monthly: m.monthly,
      daily: m.daily,
      hourly: m.hourly,
      effectiveDate: m.effectiveDate,
      law: m.law,
      notes: m.notes || d.notes,
      sectorRates: d.sectorRates || null,
      previousRates: d.previousRates || null,
      livingWage: d.livingWage || null,
      noMinimumWage: !!d.noMinimumWage,
      compliance: d.compliance || null,
      fMonthly: m.monthly ? fmt(m.monthly, d.currency) : null,
      fDaily: m.daily ? fmt(m.daily, d.currency) : null,
      fHourly: m.hourly ? fmt(m.hourly, d.currency) : null
    };
  }

  // ── Overtime Calculator ───────────────────────────────
  function calculateOvertime(params) {
    if (typeof OVERTIME_RULES === "undefined" || !OVERTIME_RULES[params.country]) return null;
    var rules = OVERTIME_RULES[params.country];
    var weeklyHrs = rules.standardHours.weekly || 40;
    var hourlyRate = params.monthlySalary / (weeklyHrs * 4.33);

    // Determine multiplier based on day type
    var rates = rules.overtimeRate;
    var otMultiplier = 1.5; // default
    var dayType = params.dayType || "weekday";

    if (dayType === "weekday") {
      otMultiplier = rates.weekday || rates.daytime || rates.first8hrs || rates.day || 1.5;
    } else if (dayType === "weekend" || dayType === "restDay") {
      otMultiplier = rates.weekend || rates.restDay || rates.sunday || rates.restDayDay || 2.0;
    } else if (dayType === "publicHoliday") {
      otMultiplier = rates.publicHoliday || rates.restDay || 2.0;
    } else if (dayType === "night") {
      otMultiplier = rates.night || rates.nighttime || rates.nightWeekday || 1.5;
    }

    var overtimePay = hourlyRate * otMultiplier * params.overtimeHours;
    var totalPay = params.monthlySalary + overtimePay;
    var effectiveHourly = totalPay / (weeklyHrs * 4.33 + params.overtimeHours);

    return {
      country: rules.name,
      currency: rules.currency,
      symbol: CURRENCY_SYMBOLS[rules.currency] || rules.currency + " ",
      standardHours: rules.standardHours,
      hourlyRate: hourlyRate,
      otMultiplier: otMultiplier,
      overtimeHours: params.overtimeHours,
      overtimePay: overtimePay,
      totalPay: totalPay,
      effectiveHourly: effectiveHourly,
      maxOvertime: rules.maxOvertime || null,
      notes: rules.notes || "",
      exemptions: rules.exemptions || null,
      timeOff: rules.timeOff || null,
      fHourlyRate: fmt(hourlyRate, rules.currency),
      fOvertimePay: fmt(overtimePay, rules.currency),
      fTotalPay: fmt(totalPay, rules.currency),
      fEffectiveHourly: fmt(effectiveHourly, rules.currency)
    };
  }

  // ── Leave Entitlements ────────────────────────────────
  function getLeaveEntitlements(cc) {
    if (typeof LEAVE_ENTITLEMENTS === "undefined" || !LEAVE_ENTITLEMENTS[cc]) return null;
    var d = LEAVE_ENTITLEMENTS[cc];
    var totalDaysOff = (d.annualLeave ? d.annualLeave.days || 0 : 0) + (d.publicHolidays || 0);
    return {
      country: d.name,
      flag: d.flag,
      currency: d.currency,
      annualLeave: d.annualLeave || { days: 0 },
      sickLeave: d.sickLeave || { days: null, notes: "Not specified" },
      maternityLeave: d.maternityLeave || { weeks: 0 },
      paternityLeave: d.paternityLeave || { days: 0, notes: "Not specified" },
      publicHolidays: d.publicHolidays || 0,
      compassionateLeave: d.compassionateLeave || null,
      familyResponsibility: d.familyResponsibility || null,
      totalDaysOff: totalDaysOff
    };
  }

  // ── Social Security Calculator ────────────────────────
  function calculateSocialSecurity(cc, monthlySalary) {
    if (typeof SOCIAL_SECURITY === "undefined" || !SOCIAL_SECURITY[cc]) return null;
    var d = SOCIAL_SECURITY[cc];
    var totalEmployee = 0;
    var totalEmployer = 0;
    var breakdown = [];

    for (var i = 0; i < d.schemes.length; i++) {
      var s = d.schemes[i];
      var eeRate = typeof s.employeeRate === "number" ? s.employeeRate : 0;
      var erRate = typeof s.employerRate === "number" ? s.employerRate : 0;

      // Apply cap if exists
      var applicableSalary = monthlySalary;
      if (s.cap && s.cap.monthly && monthlySalary > s.cap.monthly) {
        applicableSalary = s.cap.monthly;
      }

      var eeAmount = applicableSalary * (eeRate / 100);
      var erAmount = applicableSalary * (erRate / 100);
      totalEmployee += eeAmount;
      totalEmployer += erAmount;

      breakdown.push({
        name: s.name,
        employeeRate: eeRate,
        employerRate: erRate,
        employeeAmount: eeAmount,
        employerAmount: erAmount,
        cap: s.cap || null,
        notes: s.notes || "",
        law: s.law || "",
        fEmployeeAmount: fmt(eeAmount, d.currency),
        fEmployerAmount: fmt(erAmount, d.currency)
      });
    }

    return {
      country: d.name,
      flag: d.flag,
      currency: d.currency,
      symbol: CURRENCY_SYMBOLS[d.currency] || d.currency + " ",
      monthlySalary: monthlySalary,
      totalEmployee: totalEmployee,
      totalEmployer: totalEmployer,
      totalContribution: totalEmployee + totalEmployer,
      netAfterDeductions: monthlySalary - totalEmployee,
      totalCostToEmployer: monthlySalary + totalEmployer,
      breakdown: breakdown,
      annualEmployee: totalEmployee * 12,
      annualEmployer: totalEmployer * 12,
      annualTotal: (totalEmployee + totalEmployer) * 12,
      fTotalEmployee: fmt(totalEmployee, d.currency),
      fTotalEmployer: fmt(totalEmployer, d.currency),
      fTotalContribution: fmt(totalEmployee + totalEmployer, d.currency),
      fNetAfterDeductions: fmt(monthlySalary - totalEmployee, d.currency),
      fTotalCostToEmployer: fmt(monthlySalary + totalEmployer, d.currency)
    };
  }

  // ── Pension Projection ────────────────────────────────
  function projectPension(params) {
    if (typeof PENSION_SYSTEMS === "undefined") return null;
    var system = PENSION_SYSTEMS[params.country] || {};
    var currentAge = params.currentAge || 30;
    var retAge = params.retirementAge || system.retirementAge || 60;
    var yearsToRetirement = retAge - currentAge;
    if (yearsToRetirement <= 0) return null;

    var salary = params.currentSalary || 0;
    var annualGrowth = (params.salaryGrowth || 3) / 100;
    var contribRate = (params.contributionRate || system.defaultContribution || 10) / 100;
    var growthRate = (params.growthRate || 8) / 100;
    var balance = params.currentBalance || 0;

    var yearlyProjection = [];
    for (var y = 0; y < yearsToRetirement; y++) {
      var annualContrib = salary * 12 * contribRate;
      var growth = balance * growthRate;
      balance += annualContrib + growth;
      salary *= (1 + annualGrowth);
      yearlyProjection.push({
        year: currentAge + y + 1,
        balance: balance,
        contribution: annualContrib,
        growth: growth
      });
    }

    // 4% rule for sustainable withdrawal
    var monthlyPension = balance * 0.04 / 12;
    var finalMonthlySalary = salary;
    var replacementRatio = finalMonthlySalary > 0 ? (monthlyPension / finalMonthlySalary) * 100 : 0;
    var currency = system.currency || "USD";

    return {
      country: system.name || params.country,
      flag: system.flag || "",
      currency: currency,
      symbol: CURRENCY_SYMBOLS[currency] || currency + " ",
      retirementAge: retAge,
      yearsToRetirement: yearsToRetirement,
      finalBalance: balance,
      monthlyPension: monthlyPension,
      replacementRatio: replacementRatio,
      finalSalary: finalMonthlySalary,
      totalContributed: yearlyProjection.reduce(function (s, y) { return s + y.contribution; }, 0),
      totalGrowth: yearlyProjection.reduce(function (s, y) { return s + y.growth; }, 0),
      yearlyProjection: yearlyProjection,
      pensionType: system.pensionType || "contributory",
      notes: system.notes || "",
      fFinalBalance: fmt(balance, currency),
      fMonthlyPension: fmt(monthlyPension, currency),
      fReplacementRatio: replacementRatio.toFixed(1) + "%"
    };
  }

  // ── Public API ────────────────────────────────────────
  window.AfroTools.HREngine = {
    getMinimumWage: getMinimumWage,
    calculateOvertime: calculateOvertime,
    getLeaveEntitlements: getLeaveEntitlements,
    calculateSocialSecurity: calculateSocialSecurity,
    projectPension: projectPension,
    formatCurrency: fmt,
    formatNumber: fmtNum,
    getAllCountryCodes: getAllCountryCodes,
    CURRENCY_SYMBOLS: CURRENCY_SYMBOLS
  };
})();
