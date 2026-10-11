(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AfroTools = root.AfroTools || {}; root.AfroTools.NigeriaPayrollLabour = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var max = BigInt(Number.MAX_SAFE_INTEGER);
  function scaled(raw, allowZero) {
    if (typeof raw !== 'string' && typeof raw !== 'number') return null;
    var value = String(raw).trim();
    if (!/^\d+(?:\.\d{1,2})?$/.test(value) || value.length > 20) return null;
    var parts = value.split('.'), amount = BigInt(parts[0]) * 100n + BigInt(((parts[1] || '') + '00').slice(0, 2));
    return amount <= max && (allowZero ? amount >= 0n : amount > 0n) ? amount : null;
  }
  function fail(field, code) { return { valid: false, field: field, code: code }; }
  function round(numerator, denominator) { return (numerator + denominator / 2n) / denominator; }
  function calculate(input) {
    if (!input || typeof input !== 'object') return fail('labourAssumptions', 'selection-required');
    var rawHours = input.overtimeHours;
    if (rawHours == null || String(rawHours).trim() === '') rawHours = '0';
    var hours = scaled(rawHours, true);
    if (hours === null || hours > 74400n) return fail('overtimeHours', 'hours-out-of-range');
    var overtime = 0n, hourly = null;
    if (hours > 0n) {
      hourly = scaled(input.overtimeHourlyPay, false);
      if (hourly === null) return fail('overtimeHourlyPay', 'positive-money-required');
      overtime = round(hours * hourly, 100n);
      if (overtime > max) return fail('overtimeHourlyPay', 'amount-too-large');
    }
    if (input.leaveBudget !== 'exclude' && input.leaveBudget !== 'include') return fail('leaveBudget', 'selection-required');
    var provision = 0n, leave = { included: false };
    if (input.leaveBudget === 'include') {
      var basis = scaled(input.leavePayBase, false), days = scaled(input.leaveDays, false), divisor = scaled(input.paidDaysPerMonth, false);
      if (basis === null) return fail('leavePayBase', 'positive-money-required');
      if (days === null || days % 100n !== 0n || days > 36600n) return fail('leaveDays', 'whole-days-out-of-range');
      if (divisor === null || divisor > 3100n) return fail('paidDaysPerMonth', 'paid-days-out-of-range');
      provision = round(basis * days, divisor * 12n);
      if (provision > max) return fail('leavePayBase', 'amount-too-large');
      leave = { included: true, monthlyPayBasisKobo: Number(basis), annualDays: Number(days) / 100, paidDaysPerMonth: Number(divisor) / 100 };
    }
    return { valid: true, currency: 'NGN', overtimeHours: Number(hours) / 100, overtimeHourlyPayKobo: hourly === null ? null : Number(hourly), overtimePayKobo: Number(overtime), leaveMonthlyBudgetKobo: Number(provision), leave: leave,
      assumptions: 'user-confirmed', overtimeBasis: 'agreed-total-hourly-overtime-pay', leaveTreatment: 'separate-budget-not-payment-in-lieu', currentLawVerified: false, sourceId: 'ng-labour-act-sections-13-18-19' };
  }
  return { calculate: calculate };
});
