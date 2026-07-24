(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.FuelTrackerEngine = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var DAY_MS = 86400000;

  function finite(value) {
    var number = Number(value);
    return Number.isFinite(number) ? number : NaN;
  }

  function ageDays(dateValue, nowValue) {
    var date = Date.parse(dateValue || '');
    var now = Date.parse(nowValue || new Date().toISOString());
    if (!Number.isFinite(date) || !Number.isFinite(now)) return Infinity;
    return Math.max(0, Math.floor((now - date) / DAY_MS));
  }

  function rowUsability(row, fuel, nowValue, maxAgeDays) {
    var type = fuel === 'diesel' || fuel === 'lpg' ? fuel : 'petrol';
    var item = row && row[type];
    var local = finite(item && item.price);
    var usd = finite(item && item.usd);
    var age = ageDays(row && row.last_updated, nowValue);
    var limit = Number.isFinite(Number(maxAgeDays)) ? Number(maxAgeDays) : 45;
    var sourceUrl = row && (row.official_verified === true ? row.official_source_url : row.source_url) || '';
    var usable = Boolean(row && row.code && local > 0 && usd > 0 && sourceUrl && age <= limit);
    return {
      usable: usable,
      ageDays: age,
      reason: usable ? '' : !row ? 'Country row unavailable.' : !sourceUrl ? 'No row-level source link.' : age > limit ? 'Snapshot is older than ' + limit + ' days.' : 'Selected fuel price is unavailable.',
      localPrice: local,
      usdPrice: usd,
      unit: type === 'lpg' ? 'kg' : 'litre',
      sourceUrl: sourceUrl
    };
  }

  function calculateGenerator(input) {
    var price = finite(input && input.pricePerLitre);
    var rate = finite(input && input.litresPerHour);
    var hours = finite(input && input.hoursPerDay);
    var days = finite(input && input.daysPerMonth);
    var errors = [];
    if (!(price > 0 && price <= 10000000)) errors.push('Enter a fuel price greater than 0.');
    if (!(rate > 0 && rate <= 1000)) errors.push('Enter consumption between 0 and 1,000 litres per hour.');
    if (!(hours > 0 && hours <= 24)) errors.push('Hours per day must be between 0 and 24.');
    if (!(days > 0 && days <= 31)) errors.push('Days per month must be between 0 and 31.');
    if (errors.length) return { ok: false, errors: errors };
    var dailyLitres = rate * hours;
    var monthlyLitres = dailyLitres * days;
    var dailyCost = dailyLitres * price;
    var monthlyCost = monthlyLitres * price;
    return {
      ok: true,
      dailyLitres: dailyLitres,
      monthlyLitres: monthlyLitres,
      dailyCost: dailyCost,
      monthlyCost: monthlyCost,
      annualCost: monthlyCost * 12,
      formula: 'litres/hour × hours/day × days/month × price/litre'
    };
  }

  return { ageDays: ageDays, rowUsability: rowUsability, calculateGenerator: calculateGenerator };
}));
