(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.dueDateRangeEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var DAY_MS = 86400000;

  function parseIsoDate(value) {
    if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
    var parts = value.split('-').map(Number);
    var date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
    if (
      date.getUTCFullYear() !== parts[0] ||
      date.getUTCMonth() !== parts[1] - 1 ||
      date.getUTCDate() !== parts[2]
    ) return null;
    return date;
  }

  function toIsoDate(date) {
    return date.toISOString().slice(0, 10);
  }

  function addDays(date, days) {
    return new Date(date.getTime() + days * DAY_MS);
  }

  function validate(input) {
    input = input || {};
    if (input.method !== 'lmp' && input.method !== 'ivf') {
      return { valid: false, field: 'method', error: 'Choose LMP or documented embryo transfer.' };
    }
    var date = parseIsoDate(input.date);
    if (!date) return { valid: false, field: 'date', error: 'Enter a valid calendar date.' };
    var asOf = parseIsoDate(input.asOf || toIsoDate(new Date()));
    if (!asOf) return { valid: false, field: 'date', error: 'The calculation date is invalid.' };
    if (date.getTime() > asOf.getTime()) {
      return { valid: false, field: 'date', error: 'The entered date cannot be after today.' };
    }

    if (input.method === 'lmp') {
      var cycleLength = Number(input.cycleLength);
      if (!Number.isInteger(cycleLength) || cycleLength < 21 || cycleLength > 35) {
        return {
          valid: false,
          field: 'cycleLength',
          error: 'Enter a usual cycle length from 21 to 35 days.'
        };
      }
      var oldestLmpDays = 294 + (cycleLength - 28);
      if (date.getTime() < addDays(asOf, -oldestLmpDays).getTime()) {
        return {
          valid: false,
          field: 'date',
          error: 'Enter an LMP date within this estimate\'s 42-week boundary.'
        };
      }
      return { valid: true, date: date, cycleLength: cycleLength, embryoAge: null };
    }

    var embryoAge = Number(input.embryoAge);
    if (embryoAge !== 3 && embryoAge !== 5) {
      return {
        valid: false,
        field: 'embryoAge',
        error: 'Choose a documented day-3 or day-5 embryo transfer.'
      };
    }
    var oldestTransferDays = embryoAge === 3 ? 277 : 275;
    if (date.getTime() < addDays(asOf, -oldestTransferDays).getTime()) {
      return {
        valid: false,
        field: 'date',
        error: 'Enter a transfer date within its 42-week pregnancy window.'
      };
    }
    return { valid: true, date: date, cycleLength: null, embryoAge: embryoAge };
  }

  function calculate(input) {
    var check = validate(input);
    if (!check.valid) return check;

    var dueDate;
    var methodSummary;
    if (input.method === 'lmp') {
      dueDate = addDays(check.date, 280 + (check.cycleLength - 28));
      methodSummary = 'Calculated from the first day of LMP using 280 days, adjusted by ' +
        (check.cycleLength - 28) + ' day(s) for the entered ' + check.cycleLength + '-day cycle.';
    } else {
      var offset = check.embryoAge === 3 ? 263 : 261;
      dueDate = addDays(check.date, offset);
      methodSummary = 'Calculated from a documented day-' + check.embryoAge +
        ' embryo transfer using the ACOG ' + offset + '-day offset.';
    }

    return {
      valid: true,
      method: input.method,
      inputDate: toIsoDate(check.date),
      cycleLength: check.cycleLength,
      embryoAge: check.embryoAge,
      dueDate: toIsoDate(dueDate),
      week37Date: toIsoDate(addDays(dueDate, -21)),
      week42Date: toIsoDate(addDays(dueDate, 14)),
      methodSummary: methodSummary
    };
  }

  return {
    parseIsoDate: parseIsoDate,
    toIsoDate: toIsoDate,
    addDays: addDays,
    validate: validate,
    calculate: calculate
  };
});
