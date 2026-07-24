(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.InflationScenario = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value) {
    if (value === '' || value === null || value === undefined) return NaN;
    return Number(value);
  }

  function recentDate(value, today) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '')) return false;
    var checked = new Date(value + 'T00:00:00Z');
    var now = today ? new Date(today + 'T00:00:00Z') : new Date();
    var age = (now.getTime() - checked.getTime()) / 86400000;
    return Number.isFinite(age) && age >= 0 && age <= 365;
  }

  function calculate(input, today) {
    var amount = number(input.amount), rate = number(input.annualRate), years = number(input.years);
    var currency = String(input.currency || '').trim().toUpperCase();
    var sourceLabel = String(input.sourceLabel || '').trim();
    if (!/^[A-Z]{3,8}$/.test(currency)) return { ok: false, error: 'invalid_context' };
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e15) return { ok: false, error: 'invalid_amount' };
    if (!Number.isFinite(rate) || rate <= -100 || rate > 1000) return { ok: false, error: 'invalid_rate' };
    if (!Number.isFinite(years) || years <= 0 || years > 100) return { ok: false, error: 'invalid_period' };
    if (!sourceLabel || sourceLabel.length > 180 || !recentDate(input.sourceDate, today)) return { ok: false, error: 'invalid_evidence' };
    var factor = Math.pow(1 + rate / 100, years);
    if (!Number.isFinite(factor) || factor <= 0) return { ok: false, error: 'invalid_rate' };
    var priceEquivalent = amount * factor;
    var purchasingPower = amount / factor;
    var purchasingPowerChange = purchasingPower - amount;
    var requiredIncrease = priceEquivalent - amount;
    var timeline = [];
    var wholeYears = Math.min(100, Math.floor(years));
    for (var year = 0; year <= wholeYears; year += 1) {
      timeline.push({ year: year, priceEquivalent: amount * Math.pow(1 + rate / 100, year), purchasingPower: amount / Math.pow(1 + rate / 100, year) });
    }
    if (years !== wholeYears) timeline.push({ year: years, priceEquivalent: priceEquivalent, purchasingPower: purchasingPower });
    return { ok: true, currency: currency, amount: amount, annualRate: rate, years: years, sourceLabel: sourceLabel, sourceDate: input.sourceDate, factor: factor, priceEquivalent: priceEquivalent, purchasingPower: purchasingPower, purchasingPowerChange: purchasingPowerChange, requiredIncrease: requiredIncrease, timeline: timeline };
  }

  return { calculate: calculate, recentDate: recentDate };
});
