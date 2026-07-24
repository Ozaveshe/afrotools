(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.RouteFaresEngine = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value, name, options) {
    var parsed = Number(value);
    var min = options && Number.isFinite(options.min) ? options.min : 0;
    var max = options && Number.isFinite(options.max) ? options.max : Number.MAX_SAFE_INTEGER;
    if (!Number.isFinite(parsed) || parsed < min || parsed > max) {
      throw new Error(name + ' must be between ' + min + ' and ' + max + '.');
    }
    return parsed;
  }

  function calculate(input) {
    input = input || {};
    var fare = number(input.fare, 'Fare per ride', { min: 0.01 });
    var ridesPerDay = number(input.ridesPerDay, 'Rides per day', { min: 1, max: 20 });
    var days = number(input.days, 'Travel days', { min: 1, max: 366 });
    var extraPerRide = number(input.extraPerRide || 0, 'Extra cost per ride', { min: 0 });
    var bufferPercent = number(input.bufferPercent || 0, 'Buffer', { min: 0, max: 100 });
    var previousFare = input.previousFare === '' || input.previousFare == null
      ? null
      : number(input.previousFare, 'Previous fare', { min: 0.01 });
    var base = (fare + extraPerRide) * ridesPerDay * days;
    var buffer = base * bufferPercent / 100;
    var total = base + buffer;
    var changePercent = previousFare == null ? null : (fare - previousFare) / previousFare * 100;
    return {
      fare: fare,
      ridesPerDay: ridesPerDay,
      days: days,
      totalRides: ridesPerDay * days,
      base: base,
      buffer: buffer,
      total: total,
      daily: total / days,
      changePercent: changePercent
    };
  }

  return { calculate: calculate };
});
