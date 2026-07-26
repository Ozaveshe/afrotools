(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.pregnancyAppointmentEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var DAY_MS = 86400000;
  var CONTACTS = [
    { number: 1, week: 12, timing: 'By 12 weeks', purpose: 'Confirm the local booking plan.' },
    { number: 2, week: 20, timing: '20 weeks', purpose: 'Review the clinic date and planned assessments.' },
    { number: 3, week: 26, timing: '26 weeks', purpose: 'Confirm what your local service schedules.' },
    { number: 4, week: 30, timing: '30 weeks', purpose: 'Review the later-pregnancy visit plan.' },
    { number: 5, week: 34, timing: '34 weeks', purpose: 'Check the birth and emergency-preparation plan.' },
    { number: 6, week: 36, timing: '36 weeks', purpose: 'Confirm the facility-specific plan.' },
    { number: 7, week: 38, timing: '38 weeks', purpose: 'Follow the maternity team’s monitoring plan.' },
    { number: 8, week: 40, timing: '40 weeks', purpose: 'Ask what to do if pregnancy continues.' }
  ];

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

  function daysBetween(earlier, later) {
    return Math.floor((later.getTime() - earlier.getTime()) / DAY_MS);
  }

  function validate(input) {
    input = input || {};
    var basis = input.basis;
    if (basis !== 'confirmed-edd' && basis !== 'lmp') {
      return { valid: false, error: 'Choose a confirmed due date or a last-period date.' };
    }
    var date = parseIsoDate(input.date);
    if (!date) return { valid: false, error: 'Enter a valid calendar date.' };

    var asOf = parseIsoDate(input.asOf || toIsoDate(new Date()));
    if (!asOf) return { valid: false, error: 'The calculation date is invalid.' };

    if (basis === 'lmp' && date.getTime() > asOf.getTime()) {
      return { valid: false, error: 'A last-period date cannot be after the calculation date.' };
    }
    if (basis === 'confirmed-edd') {
      var earliestEdd = addDays(asOf, -14);
      var latestEdd = addDays(asOf, 280);
      if (date.getTime() < earliestEdd.getTime() || date.getTime() > latestEdd.getTime()) {
        return {
          valid: false,
          error: 'Enter a confirmed due date from the past 14 days through the next 280 days.'
        };
      }
    }

    var cycleLength = Number(input.cycleLength == null ? 28 : input.cycleLength);
    if (basis === 'lmp' && (!Number.isInteger(cycleLength) || cycleLength < 21 || cycleLength > 35)) {
      return { valid: false, error: 'Enter a usual cycle length from 21 to 35 days.' };
    }

    return { valid: true, date: date, asOf: asOf, cycleLength: cycleLength };
  }

  function calculate(input) {
    var check = validate(input);
    if (!check.valid) return check;

    var basis = input.basis;
    var adjustment = basis === 'lmp' ? check.cycleLength - 28 : 0;
    var dueDate = basis === 'lmp' ? addDays(check.date, 280 + adjustment) : check.date;
    var contactBase = addDays(dueDate, -280);

    var gestationalDays = daysBetween(contactBase, check.asOf);
    var gestationalAge = null;
    if (gestationalDays >= 0 && gestationalDays <= 294) {
      gestationalAge = {
        totalDays: gestationalDays,
        weeks: Math.floor(gestationalDays / 7),
        days: gestationalDays % 7
      };
    }

    var contacts = CONTACTS.map(function (contact) {
      return {
        number: contact.number,
        week: contact.week,
        timing: contact.timing,
        purpose: contact.purpose,
        date: toIsoDate(addDays(contactBase, contact.week * 7))
      };
    });

    return {
      valid: true,
      basis: basis,
      cycleLength: basis === 'lmp' ? check.cycleLength : null,
      inputDate: toIsoDate(check.date),
      calculatedOn: toIsoDate(check.asOf),
      dueDate: toIsoDate(dueDate),
      week37Date: toIsoDate(addDays(dueDate, -21)),
      week42Date: toIsoDate(addDays(dueDate, 14)),
      gestationalAge: gestationalAge,
      contacts: contacts,
      assumptions: basis === 'lmp'
        ? 'Provisional LMP estimate using 280 days plus the cycle-length difference from 28 days.'
        : 'Appointment dates are mapped backwards from the maternity-team estimated due date.'
    };
  }

  return {
    CONTACTS: CONTACTS,
    parseIsoDate: parseIsoDate,
    toIsoDate: toIsoDate,
    addDays: addDays,
    validate: validate,
    calculate: calculate
  };
});
