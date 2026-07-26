(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.teacherSalaryEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function number(value) {
    if (value === '' || value === null || value === undefined) return 0;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function validate(input) {
    input = input || {};
    var values = {
      baseMonthly: number(input.baseMonthly),
      allowancesMonthly: number(input.allowancesMonthly),
      deductionsMonthly: number(input.deductionsMonthly),
      weeklyHours: number(input.weeklyHours),
      workingWeeks: number(input.workingWeeks)
    };
    var errors = [];
    ['baseMonthly', 'allowancesMonthly', 'deductionsMonthly'].forEach(function (key) {
      if (!Number.isFinite(values[key]) || values[key] < 0) errors.push('Salary amounts must be zero or greater.');
    });
    if (values.baseMonthly <= 0) errors.push('Enter the gross monthly base salary from the offer or payslip.');
    if (!Number.isFinite(values.weeklyHours) || values.weeklyHours <= 0 || values.weeklyHours > 100) {
      errors.push('Weekly hours must be above 0 and no more than 100.');
    }
    if (!Number.isFinite(values.workingWeeks) || values.workingWeeks < 1 || values.workingWeeks > 52) {
      errors.push('Working weeks per year must be between 1 and 52.');
    }
    if (errors.length) return { ok: false, errors: Array.from(new Set(errors)) };
    var grossCashMonthly = values.baseMonthly + values.allowancesMonthly;
    var estimatedTakeHomeMonthly = grossCashMonthly - values.deductionsMonthly;
    if (estimatedTakeHomeMonthly < 0) errors.push('Monthly deductions cannot exceed base salary plus recurring allowances.');
    if (errors.length) return { ok: false, errors: errors };
    var annualCash = grossCashMonthly * 12;
    var annualTakeHome = estimatedTakeHomeMonthly * 12;
    var annualHours = values.weeklyHours * values.workingWeeks;
    return {
      ok: true,
      baseMonthly: values.baseMonthly,
      allowancesMonthly: values.allowancesMonthly,
      deductionsMonthly: values.deductionsMonthly,
      weeklyHours: values.weeklyHours,
      workingWeeks: values.workingWeeks,
      grossCashMonthly: grossCashMonthly,
      estimatedTakeHomeMonthly: estimatedTakeHomeMonthly,
      annualCash: annualCash,
      annualTakeHome: annualTakeHome,
      annualHours: annualHours,
      grossHourly: annualHours ? annualCash / annualHours : 0,
      takeHomeHourly: annualHours ? annualTakeHome / annualHours : 0,
      deductionShare: grossCashMonthly ? values.deductionsMonthly / grossCashMonthly * 100 : 0
    };
  }

  return { validate: validate };
});
