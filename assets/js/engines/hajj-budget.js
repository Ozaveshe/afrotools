(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.hajjBudget = api;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var ORIGINS = Object.freeze({
    NG: { label: 'Nigeria', multiplier: 1, currency: 'NGN' },
    KE: { label: 'Kenya', multiplier: 0.92, currency: 'KES' },
    ZA: { label: 'Afrika Kusini', multiplier: 1.18, currency: 'ZAR' },
    GH: { label: 'Ghana', multiplier: 0.88, currency: 'GHS' },
    EG: { label: 'Misri', multiplier: 0.72, currency: 'EGP' },
    ET: { label: 'Ethiopia', multiplier: 0.58, currency: 'ETB' },
    TZ: { label: 'Tanzania', multiplier: 0.66, currency: 'TZS' },
    UG: { label: 'Uganda', multiplier: 0.62, currency: 'UGX' },
    RW: { label: 'Rwanda', multiplier: 0.74, currency: 'RWF' },
    CI: { label: "Cote d'Ivoire", multiplier: 0.82, currency: 'XOF' },
    SN: { label: 'Senegal', multiplier: 0.8, currency: 'XOF' },
    MA: { label: 'Morocco', multiplier: 0.86, currency: 'MAD' },
    TN: { label: 'Tunisia', multiplier: 0.78, currency: 'TND' },
    AO: { label: 'Angola', multiplier: 0.84, currency: 'AOA' },
    CM: { label: 'Cameroon', multiplier: 0.76, currency: 'XAF' }
  });
  var PACKAGES = Object.freeze({ economy: 4200, standard: 6200, premium: 9800 });
  var TRIP_FACTORS = Object.freeze({ hajj: 1, umrah: 0.42 });
  var DAILY_ALLOWANCE_USD = 45;
  var MAX_MONEY = 1000000000;

  function failure(field, code, message) {
    var error = new RangeError(message);
    error.field = field;
    error.code = code;
    throw error;
  }

  function number(input, field, minimum, maximum, integer) {
    if (input === '' || input === null || input === undefined) failure(field, 'INVALID_NUMBER', 'A valid number is required.');
    var value = typeof input === 'number' ? input : Number(input);
    if (!Number.isFinite(value)) failure(field, 'INVALID_NUMBER', 'A valid number is required.');
    if (integer && !Number.isInteger(value)) failure(field, 'INTEGER_REQUIRED', 'A whole number is required.');
    if (value < minimum || value > maximum) failure(field, 'OUT_OF_RANGE', 'The number is outside the supported range.');
    return value;
  }

  function choice(input, field, choices) {
    var value = String(input || '');
    if (!Object.prototype.hasOwnProperty.call(choices, value)) failure(field, 'INVALID_CHOICE', 'Choose a supported option.');
    return value;
  }

  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }

  function estimatePreset(input) {
    input = input || {};
    var origin = choice(input.origin, 'origin', ORIGINS);
    var trip = choice(input.trip, 'trip', TRIP_FACTORS);
    var packageLevel = choice(input.package, 'package', PACKAGES);
    var travelers = number(input.travelers, 'travelers', 1, 100, true);
    var days = number(input.days, 'days', 1, 365, true);
    var buffer = number(input.buffer, 'buffer', 0, 100, false);
    var originData = ORIGINS[origin];
    var basePackageUsd = PACKAGES[packageLevel] * TRIP_FACTORS[trip];
    var dailyAllowancePerTraveler = DAILY_ALLOWANCE_USD * days;
    var subtotal = (basePackageUsd + dailyAllowancePerTraveler) * travelers * originData.multiplier;
    var total = subtotal * (1 + buffer / 100);
    return {
      mode: 'preset',
      input: { origin: origin, trip: trip, travelers: travelers, package: packageLevel, days: days, buffer: buffer },
      total: round(total),
      perTraveler: round(total / travelers),
      contingencyValue: round(total - subtotal),
      subtotal: round(subtotal),
      basePackagePerTraveler: round(basePackageUsd * originData.multiplier),
      dailyAllowanceOwnerRow: round(dailyAllowancePerTraveler * travelers),
      dailyAllowanceAdjusted: round(dailyAllowancePerTraveler * travelers * originData.multiplier),
      originLabel: originData.label,
      originMultiplier: originData.multiplier,
      ownerFormula: '((packageUsd * tripFactor + 45 * days) * travelers * originMultiplier) * (1 + buffer / 100)'
    };
  }

  function estimateWrittenQuote(input) {
    input = input || {};
    var travelers = number(input.travelers, 'quoteTravelers', 1, 100, true);
    var packageCost = number(input.packageCost, 'packageCost', 0, MAX_MONEY, false);
    var cashBudget = number(input.cashBudget, 'cashBudget', 0, MAX_MONEY, false);
    var buffer = number(input.buffer, 'quoteBuffer', 0, 100, false);
    var subtotal = (packageCost + cashBudget) * travelers;
    var total = subtotal * (1 + buffer / 100);
    return {
      mode: 'written-quote',
      input: { travelers: travelers, packageCost: packageCost, cashBudget: cashBudget, buffer: buffer },
      total: round(total),
      perTraveler: round(total / travelers),
      contingencyValue: round(total - subtotal),
      subtotal: round(subtotal),
      packageTotal: round(packageCost * travelers),
      cashTotal: round(cashBudget * travelers),
      ownerFormula: '((packageCost + cashBudget) * travelers) * (1 + buffer / 100)'
    };
  }

  return Object.freeze({
    version: '1.0.0',
    owner: 'tools/hajj-budget/index.html',
    reviewedOn: '2026-08-03',
    origins: ORIGINS,
    packages: PACKAGES,
    tripFactors: TRIP_FACTORS,
    dailyAllowanceUsd: DAILY_ALLOWANCE_USD,
    estimatePreset: estimatePreset,
    estimateWrittenQuote: estimateWrittenQuote
  });
});
