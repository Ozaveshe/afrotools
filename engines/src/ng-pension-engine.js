(function (global) {
  "use strict";

  var DAY_MS = 24 * 60 * 60 * 1000;

  function number(value) {
    if (value === "" || value === null || value === undefined) return NaN;
    return Number(value);
  }

  function validAmount(value, allowZero) {
    return Number.isFinite(value) && value <= 1e15 && (allowZero ? value >= 0 : value > 0);
  }

  function validEvidence(label, checkedDate, today) {
    if (typeof label !== "string" || label.trim().length < 3 || label.trim().length > 180) return false;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(checkedDate || "")) return false;
    var checked = new Date(checkedDate + "T00:00:00Z");
    var reference = today ? new Date(today + "T00:00:00Z") : new Date();
    if (!Number.isFinite(checked.getTime()) || !Number.isFinite(reference.getTime())) return false;
    var age = Math.floor((reference.getTime() - checked.getTime()) / DAY_MS);
    return age >= 0 && age <= 365;
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculateScenario(raw) {
    raw = raw || {};
    var openingBalance = number(raw.openingBalance);
    var monthlyEmoluments = number(raw.monthlyEmoluments);
    var employeeRate = number(raw.employeeRate);
    var employerRate = number(raw.employerRate);
    var voluntaryContribution = number(raw.voluntaryContribution);
    var annualNetReturn = number(raw.annualNetReturn);
    var annualSalaryGrowth = number(raw.annualSalaryGrowth);
    var years = number(raw.years);
    var sourceLabel = String(raw.sourceLabel || "").trim();
    var sourceDate = String(raw.sourceDate || "");
    var returnSource = String(raw.returnSource || "").trim();
    var returnSourceDate = String(raw.returnSourceDate || "");

    if (!validAmount(openingBalance, true) || !validAmount(monthlyEmoluments, false) || !validAmount(voluntaryContribution, true)) return { ok: false, error: "invalid_amount" };
    if (![employeeRate, employerRate].every(function (rate) { return Number.isFinite(rate) && rate >= 0 && rate <= 100; })) return { ok: false, error: "invalid_rate" };
    if (!Number.isFinite(annualNetReturn) || annualNetReturn <= -100 || annualNetReturn > 1000 || !Number.isFinite(annualSalaryGrowth) || annualSalaryGrowth <= -100 || annualSalaryGrowth > 1000) return { ok: false, error: "invalid_assumption" };
    if (!Number.isInteger(years) || years < 1 || years > 60) return { ok: false, error: "invalid_period" };
    if (!validEvidence(sourceLabel, sourceDate, raw.today) || !validEvidence(returnSource, returnSourceDate, raw.today)) return { ok: false, error: "invalid_evidence" };

    var monthlyReturn = Math.pow(1 + annualNetReturn / 100, 1 / 12) - 1;
    var monthlyGrowth = Math.pow(1 + annualSalaryGrowth / 100, 1 / 12) - 1;
    var balance = openingBalance;
    var emoluments = monthlyEmoluments;
    var contributions = 0;
    var schedule = [];
    var months = years * 12;
    var firstEmployee = monthlyEmoluments * employeeRate / 100;
    var firstEmployer = monthlyEmoluments * employerRate / 100;

    for (var month = 1; month <= months; month += 1) {
      var employee = emoluments * employeeRate / 100;
      var employer = emoluments * employerRate / 100;
      var contribution = employee + employer + voluntaryContribution;
      balance = balance * (1 + monthlyReturn) + contribution;
      contributions += contribution;
      if (month % 12 === 0 || month === months) {
        schedule.push({
          year: Math.ceil(month / 12),
          monthlyEmoluments: roundMoney(emoluments),
          monthlyContribution: roundMoney(contribution),
          cumulativeContributions: roundMoney(contributions),
          balance: roundMoney(balance)
        });
      }
      emoluments *= 1 + monthlyGrowth;
    }

    return {
      ok: true,
      currency: "NGN",
      openingBalance: roundMoney(openingBalance),
      employeeRate: employeeRate,
      employerRate: employerRate,
      firstEmployeeContribution: roundMoney(firstEmployee),
      firstEmployerContribution: roundMoney(firstEmployer),
      firstVoluntaryContribution: roundMoney(voluntaryContribution),
      firstTotalContribution: roundMoney(firstEmployee + firstEmployer + voluntaryContribution),
      futureContributions: roundMoney(contributions),
      modeledGrowth: roundMoney(balance - openingBalance - contributions),
      projectedBalance: roundMoney(balance),
      finalMonthlyEmoluments: roundMoney(emoluments / (1 + monthlyGrowth)),
      annualNetReturn: annualNetReturn,
      annualSalaryGrowth: annualSalaryGrowth,
      years: years,
      sourceLabel: sourceLabel,
      sourceDate: sourceDate,
      returnSource: returnSource,
      returnSourceDate: returnSourceDate,
      schedule: schedule,
      method: "Monthly effective net return, month-end contributions, salary growth applied before the next month."
    };
  }

  global.NgPensionEngine = {
    calculateScenario: calculateScenario,
    checkContributions: function (emoluments, employeeRate, employerRate) {
      var amount = number(emoluments);
      var employee = number(employeeRate);
      var employer = number(employerRate);
      if (!validAmount(amount, false) || ![employee, employer].every(function (rate) { return Number.isFinite(rate) && rate >= 0 && rate <= 100; })) return { ok: false };
      return { ok: true, pensionableEmoluments: roundMoney(amount), expectedEmp: roundMoney(amount * employee / 100), expectedEr: roundMoney(amount * employer / 100), totalExpectedMonthly: roundMoney(amount * (employee + employer) / 100) };
    }
  };
})(typeof window !== "undefined" ? window : globalThis);
