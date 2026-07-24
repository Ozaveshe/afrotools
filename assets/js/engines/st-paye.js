(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.saoTomePayroll = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var EMPLOYEE_INSS_RATE = 0.04;
  var EMPLOYER_INSS_RATE = 0.06;
  var SOURCE_CHECKED_ON = '2026-07-22';
  var IRS_STATUS = 'CURRENT_SCHEDULE_UNCONFIRMED';

  function roundCurrency(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculate(input) {
    input = input || {};
    var grossMonthly = Number(input.grossMonthly);
    if (!Number.isFinite(grossMonthly) || grossMonthly < 0) {
      return { ok: false, error: 'Enter a monthly gross salary of zero or more.' };
    }

    var employeeInssMonthly = roundCurrency(grossMonthly * EMPLOYEE_INSS_RATE);
    var employerInssMonthly = roundCurrency(grossMonthly * EMPLOYER_INSS_RATE);
    var afterEmployeeInssMonthly = roundCurrency(grossMonthly - employeeInssMonthly);
    var employerCostMonthly = roundCurrency(grossMonthly + employerInssMonthly);

    return {
      ok: true,
      grossMonthly: grossMonthly,
      grossAnnual: roundCurrency(grossMonthly * 12),
      employeeInssRate: EMPLOYEE_INSS_RATE,
      employeeInssMonthly: employeeInssMonthly,
      employeeInssAnnual: roundCurrency(employeeInssMonthly * 12),
      employerInssRate: EMPLOYER_INSS_RATE,
      employerInssMonthly: employerInssMonthly,
      employerInssAnnual: roundCurrency(employerInssMonthly * 12),
      afterEmployeeInssMonthly: afterEmployeeInssMonthly,
      afterEmployeeInssAnnual: roundCurrency(afterEmployeeInssMonthly * 12),
      employerCostMonthly: employerCostMonthly,
      employerCostAnnual: roundCurrency(employerCostMonthly * 12),
      irsMonthly: null,
      irsAnnual: null,
      netMonthly: null,
      netAnnual: null,
      irsStatus: IRS_STATUS,
      sourceCheckedOn: SOURCE_CHECKED_ON
    };
  }

  return {
    employeeInssRate: EMPLOYEE_INSS_RATE,
    employerInssRate: EMPLOYER_INSS_RATE,
    irsStatus: IRS_STATUS,
    lastUpdated: SOURCE_CHECKED_ON,
    sourceCheckedOn: SOURCE_CHECKED_ON,
    calculate: calculate
  };
}));
