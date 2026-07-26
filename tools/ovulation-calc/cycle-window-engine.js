(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.cycleWindowEngine = api;
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
    var date = parseIsoDate(input.lastPeriodDate);
    if (!date) return { valid: false, field: 'lastPeriodDate', error: 'Enter a valid first day for the most recent period.' };
    var asOf = parseIsoDate(input.asOf || toIsoDate(new Date()));
    if (!asOf) return { valid: false, error: 'The calculation date is invalid.' };
    if (date.getTime() > asOf.getTime()) {
      return { valid: false, field: 'lastPeriodDate', error: 'The most recent period date cannot be after today.' };
    }

    var shortest = Number(input.shortestCycle);
    var longest = Number(input.longestCycle);
    if (!Number.isInteger(shortest) || shortest < 21 || shortest > 45) {
      return { valid: false, field: 'shortestCycle', error: 'Enter a shortest completed cycle from 21 to 45 days.' };
    }
    if (!Number.isInteger(longest) || longest < 21 || longest > 45) {
      return { valid: false, field: 'longestCycle', error: 'Enter a longest completed cycle from 21 to 45 days.' };
    }
    if (shortest > longest) {
      return { valid: false, field: 'shortestCycle', error: 'The shortest cycle cannot be longer than the longest cycle.' };
    }
    if (addDays(date, longest).getTime() < asOf.getTime()) {
      return {
        valid: false,
        field: 'lastPeriodDate',
        error: 'That cycle window has already passed. Use a more recent completed cycle record; if a period is late, follow pregnancy-test guidance or seek care.'
      };
    }
    return { valid: true, date: date, shortest: shortest, longest: longest };
  }

  function calculate(input) {
    var check = validate(input);
    if (!check.valid) return check;

    var nextPeriodStart = addDays(check.date, check.shortest);
    var nextPeriodEnd = addDays(check.date, check.longest);
    var ovulationStart = addDays(nextPeriodStart, -16);
    var ovulationEnd = addDays(nextPeriodEnd, -12);
    var pregnancyPossibleStart = addDays(ovulationStart, -5);
    var pregnancyPossibleEnd = addDays(ovulationEnd, 1);
    var variation = check.longest - check.shortest;
    var outsideCommonRange = check.shortest > 35 || check.longest > 35;
    var uncertainty = outsideCommonRange || variation > 7 ? 'extremely-low' : variation <= 3 ? 'low' : 'very-low';
    var uncertaintyCopy = outsideCommonRange
      ? 'At least one entered cycle is longer than the NHS common 21- to 35-day range, so calendar-only timing is extremely uncertain.'
      : variation <= 3
      ? 'Your entered cycles vary by ' + variation + ' day(s), but biological timing can still shift from cycle to cycle.'
      : 'Your entered cycles vary by ' + variation + ' days, so calendar-only timing is especially uncertain.';

    return {
      valid: true,
      inputDate: toIsoDate(check.date),
      shortestCycle: check.shortest,
      longestCycle: check.longest,
      variation: variation,
      outsideCommonRange: outsideCommonRange,
      uncertainty: uncertainty,
      uncertaintyCopy: uncertaintyCopy,
      nextPeriodStart: toIsoDate(nextPeriodStart),
      nextPeriodEnd: toIsoDate(nextPeriodEnd),
      ovulationStart: toIsoDate(ovulationStart),
      ovulationEnd: toIsoDate(ovulationEnd),
      pregnancyPossibleStart: toIsoDate(pregnancyPossibleStart),
      pregnancyPossibleEnd: toIsoDate(pregnancyPossibleEnd)
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
