(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else { root.AfroTools = root.AfroTools || {}; root.AfroTools.FarmPayrollValidation = api; }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  function validate(raw) {
    var type = raw.workerType;
    function fail(field, message) { return { valid: false, field: field, message: message }; }
    function number(value, optional) {
      if (value == null || String(value).trim() === '') return optional ? 0 : NaN;
      var text = String(value).trim();
      return /^(?:\d+(?:\.\d*)?|\.\d+)$/.test(text) ? Number(text) : NaN;
    }
    function finite(value) { return Number.isFinite(value) && value <= Number.MAX_SAFE_INTEGER; }
    if (['permanent', 'casual', 'seasonal', 'piece_rate'].indexOf(type) < 0) return fail('selWorkerType', 'Choose a worker type.');
    var input = { workerType: type, numWorkers: number(raw.numWorkers), grossPay: 0, daysWorked: 26,
      ratePerUnit: 0, unitsCompleted: 0, overtimeHours: number(raw.overtimeHours, true),
      inKindHousing: number(raw.inKindHousing, true), inKindFood: number(raw.inKindFood, true) };
    if (!Number.isInteger(input.numWorkers) || input.numWorkers < 1 || input.numWorkers > 100000) return fail('inpNumWorkers', 'Enter a whole number of workers from 1 to 100,000.');
    if (type !== 'piece_rate') {
      input.grossPay = number(raw.grossPay);
      if (!finite(input.grossPay) || input.grossPay <= 0) return fail(type === 'permanent' ? 'inpMonthlySalary' : 'inpDailyRate', 'Enter a pay amount greater than zero.');
    }
    if (type === 'casual' || type === 'seasonal') {
      input.daysWorked = number(raw.daysWorked);
      if (!Number.isInteger(input.daysWorked) || input.daysWorked < 1 || input.daysWorked > 31) return fail('inpDaysWorked', 'Enter a whole number of days from 1 to 31.');
    }
    if (type === 'piece_rate') {
      input.ratePerUnit = number(raw.ratePerUnit); input.unitsCompleted = number(raw.unitsCompleted);
      if (!finite(input.ratePerUnit) || input.ratePerUnit <= 0) return fail('inpRatePerUnit', 'Enter a rate per unit greater than zero.');
      if (!Number.isInteger(input.unitsCompleted) || input.unitsCompleted < 1 || input.unitsCompleted > 1000000) return fail('inpUnitsCompleted', 'Enter a whole number of units from 1 to 1,000,000.');
    }
    if (!finite(input.overtimeHours) || input.overtimeHours < 0 || input.overtimeHours > 744) return fail('inpOvertimeHours', 'Enter overtime hours from 0 to 744.');
    if (!finite(input.inKindHousing) || input.inKindHousing < 0) return fail('inpHousingValue', 'Enter a non-negative housing value.');
    if (!finite(input.inKindFood) || input.inKindFood < 0) return fail('inpFoodValue', 'Enter a non-negative food value.');
    return { valid: true, input: input };
  }
  return { validate: validate };
});
