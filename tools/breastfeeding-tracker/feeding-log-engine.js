(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.feedingLogEngine = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var TYPES = {
    breastfeed: 'Breastfeeding session',
    'expressed-milk': 'Expressed human milk',
    'wet-nappy': 'Wet nappy',
    stool: 'Stool / dirty nappy'
  };
  var SIDES = {
    left: 'Left',
    right: 'Right',
    both: 'Both',
    'not-recorded': 'Not recorded'
  };

  function optionalNumber(value, min, max, label, field) {
    if (value === '' || value === null || typeof value === 'undefined') return { valid: true, value: null };
    var number = Number(value);
    if (!Number.isFinite(number) || Math.floor(number) !== number || number < min || number > max) {
      return { valid: false, error: label + ' must be a whole number from ' + min + ' to ' + max + '.', field: field };
    }
    return { valid: true, value: number };
  }

  function parseLocalMinute(value) {
    var match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
    if (!match) return null;
    var parts = match.slice(1).map(Number);
    var date = new Date(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], 0, 0);
    if (
      date.getFullYear() !== parts[0] ||
      date.getMonth() !== parts[1] - 1 ||
      date.getDate() !== parts[2] ||
      date.getHours() !== parts[3] ||
      date.getMinutes() !== parts[4]
    ) return null;
    return date;
  }

  function create(input) {
    input = input || {};
    if (!Object.prototype.hasOwnProperty.call(TYPES, input.type)) {
      return { valid: false, error: 'Choose a supported event type.', field: 'event-type' };
    }
    var parsedEventTime = parseLocalMinute(input.timestamp);
    if (!parsedEventTime) {
      return { valid: false, error: 'Enter a valid local date and time.', field: 'event-time' };
    }
    var eventTime = parsedEventTime.getTime();
    var asOf = input.asOf ? new Date(input.asOf).getTime() : Date.now();
    if (Number.isNaN(asOf) || eventTime > asOf) {
      return { valid: false, error: 'The event time cannot be in the future.', field: 'event-time' };
    }

    var duration = optionalNumber(input.durationMinutes, 1, 180, 'Duration', 'duration-minutes');
    if (!duration.valid) return duration;
    var amount = optionalNumber(input.amountMl, 1, 500, 'Expressed amount', 'amount-ml');
    if (!amount.valid) return amount;

    var side = null;
    if (input.type === 'breastfeed') {
      if (!Object.prototype.hasOwnProperty.call(SIDES, input.side)) {
        return { valid: false, error: 'Choose a supported side value.', field: 'feeding-side' };
      }
      side = input.side;
      amount.value = null;
    } else if (input.type === 'expressed-milk') {
      side = null;
    } else {
      duration.value = null;
      amount.value = null;
    }

    return {
      valid: true,
      entry: {
        type: input.type,
        typeLabel: TYPES[input.type],
        timestamp: input.timestamp,
        side: side,
        sideLabel: side ? SIDES[side] : null,
        durationMinutes: duration.value,
        amountMl: input.type === 'expressed-milk' ? amount.value : null
      }
    };
  }

  function summarize(entries) {
    var list = Array.isArray(entries) ? entries : [];
    var counts = {};
    Object.keys(TYPES).forEach(function (type) { counts[type] = 0; });
    list.forEach(function (entry) {
      if (entry && Object.prototype.hasOwnProperty.call(counts, entry.type)) counts[entry.type] += 1;
    });
    return {
      eventCount: list.length,
      counts: counts,
      boundary: 'Counts and times cannot confirm feeding adequacy, milk supply, hydration, weight gain or illness.'
    };
  }

  return {
    TYPES: TYPES,
    SIDES: SIDES,
    create: create,
    summarize: summarize
  };
});
