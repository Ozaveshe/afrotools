(function (root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.electricityCost = api;
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value, fallback) {
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : (fallback || 0);
  }

  function round(value, digits) {
    var factor = Math.pow(10, digits == null ? 2 : digits);
    return Math.round((number(value) + Number.EPSILON) * factor) / factor;
  }

  function utcDay(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(String(value || ''))) return NaN;
    return Date.parse(String(value) + 'T00:00:00Z');
  }

  function ageDays(date, asOf) {
    var start = utcDay(date);
    var end = utcDay(asOf);
    return Number.isFinite(start) && Number.isFinite(end) ? Math.floor((end - start) / 86400000) : Infinity;
  }

  function recordStatus(record, asOf, defaultFreshnessDays) {
    if (!record || record.status !== 'official_current' || !record.source_url) {
      return { available: false, stale: false, reason: 'unsupported' };
    }
    var today = asOf || new Date().toISOString().slice(0, 10);
    if (record.valid_to && utcDay(record.valid_to) < utcDay(today)) {
      return { available: false, stale: true, reason: 'expired' };
    }
    var maxAge = Math.max(1, number(record.max_age_days, defaultFreshnessDays || 45));
    var age = ageDays(record.last_verified_at, today);
    if (!Number.isFinite(age) || age < 0 || age > maxAge) {
      return { available: false, stale: true, reason: 'verification_too_old', age_days: age };
    }
    return { available: true, stale: false, reason: 'current', age_days: age };
  }

  function validateDataset(dataset) {
    var errors = [];
    if (!dataset || dataset.schema_version !== 1 || !Array.isArray(dataset.records)) {
      return { valid: false, errors: ['Dataset schema is invalid.'] };
    }
    var ids = {};
    dataset.records.forEach(function (record, index) {
      var required = ['market_id', 'country_code', 'country_name', 'provider_id', 'provider_name', 'tariff_id', 'tariff_name', 'customer_class', 'meter_type', 'currency', 'billing_unit', 'pricing_model', 'tiers', 'effective_date', 'last_verified_at', 'source_name', 'source_url', 'granularity', 'confidence', 'status', 'notes'];
      required.forEach(function (key) { if (record[key] == null || record[key] === '') errors.push('Record ' + index + ' missing ' + key + '.'); });
      if (ids[record.tariff_id]) errors.push('Duplicate tariff_id ' + record.tariff_id + '.');
      ids[record.tariff_id] = true;
      if (!Array.isArray(record.tiers) || !record.tiers.length) errors.push('Record ' + index + ' has no tiers.');
      (record.tiers || []).forEach(function (tier) {
        if (!(number(tier.rate) > 0) || number(tier.from) < 0) errors.push('Record ' + index + ' has an invalid tier.');
      });
    });
    return { valid: errors.length === 0, errors: errors };
  }

  function percentageItems(items, base) {
    return (items || []).map(function (item) {
      var amount = item.type === 'fixed' ? number(item.value) : base * number(item.value) / 100;
      return { id: item.id || 'charge', label: item.label || 'Charge', amount: round(amount, 6) };
    });
  }

  function energyCost(record, units) {
    var remaining = Math.max(0, number(units));
    var cost = 0;
    var breakdown = [];
    var tiers = (record.tiers || []).slice().sort(function (a, b) { return number(a.from) - number(b.from); });
    for (var i = 0; i < tiers.length && remaining > 0; i += 1) {
      var tier = tiers[i];
      var from = number(tier.from);
      var capacity = tier.up_to == null ? remaining : Math.max(0, number(tier.up_to) - from);
      var used = Math.min(remaining, capacity);
      if (used <= 0) continue;
      var tierCost = used * number(tier.rate);
      cost += tierCost;
      breakdown.push({ label: tier.label || ('Tier ' + (i + 1)), units: round(used, 6), rate: number(tier.rate), cost: round(tierCost, 6) });
      remaining -= used;
    }
    if (remaining > 0) return { ok: false, error: 'Tariff tiers do not cover the requested units.' };
    return { ok: true, energy_charge: round(cost, 6), tier_breakdown: breakdown };
  }

  function calculateBill(record, units, options) {
    options = options || {};
    units = number(units);
    if (!record || units <= 0) return { ok: false, error: 'Enter electricity units greater than zero.' };
    var energy = energyCost(record, units);
    if (!energy.ok) return energy;
    var fixed = Math.max(0, number(record.fixed_charge));
    var subtotal = energy.energy_charge + fixed;
    var levies = percentageItems(record.levies, subtotal);
    var afterLevies = subtotal + levies.reduce(function (sum, item) { return sum + item.amount; }, 0);
    var taxes = percentageItems(record.taxes, afterLevies);
    var rawTotal = afterLevies + taxes.reduce(function (sum, item) { return sum + item.amount; }, 0);
    var total = Math.max(rawTotal, number(record.minimum_charge));
    return {
      ok: true,
      mode: 'units_to_bill',
      units: round(units, 4),
      energy_charge: round(energy.energy_charge, 2),
      fixed_charge: round(fixed, 2),
      levies: levies,
      taxes: taxes,
      minimum_charge_applied: total > rawTotal,
      total: round(total, 2),
      effective_rate: round(total / units, 4),
      tier_breakdown: energy.tier_breakdown,
      currency: record.currency,
      tariff_id: record.tariff_id,
      assumptions: options.assumptions || []
    };
  }

  function prepaidNetAmount(record, money, extraDeductions) {
    var deductions = percentageItems((record.prepaid_deductions || []).concat(extraDeductions || []), money);
    var total = deductions.reduce(function (sum, item) { return sum + item.amount; }, 0);
    return { net: Math.max(0, money - total), deductions: deductions, deduction_total: round(total, 2) };
  }

  function calculateUnits(record, money, options) {
    options = options || {};
    money = number(money);
    if (!record || money <= 0) return { ok: false, error: 'Enter a purchase amount greater than zero.' };
    var net = prepaidNetAmount(record, money, options.extra_deductions);
    if (net.net <= 0) return { ok: false, error: 'Deductions use the full purchase amount; no money remains for energy.' };
    var low = 0;
    var high = Math.max(1, net.net / Math.min.apply(null, record.tiers.map(function (tier) { return number(tier.rate); })) + 1);
    for (var i = 0; i < 80; i += 1) {
      var mid = (low + high) / 2;
      var cost = energyCost(record, mid);
      if (!cost.ok || cost.energy_charge > net.net) high = mid;
      else low = mid;
    }
    var finalCost = energyCost(record, low);
    return {
      ok: true,
      mode: 'money_to_units',
      purchase_amount: round(money, 2),
      deduction_total: net.deduction_total,
      deductions: net.deductions,
      amount_for_energy: round(net.net, 2),
      units: round(low, 4),
      energy_charge: round(finalCost.energy_charge, 2),
      effective_rate: round(money / low, 4),
      tier_breakdown: finalCost.tier_breakdown,
      currency: record.currency,
      tariff_id: record.tariff_id,
      assumptions: options.assumptions || []
    };
  }

  function recordsForCountry(dataset, countryCode) {
    return (dataset && dataset.records || []).filter(function (record) { return record.country_code === countryCode; });
  }

  function formatMoney(value, currency, locale) {
    try {
      return new Intl.NumberFormat(locale || 'en', { style: 'currency', currency: currency, maximumFractionDigits: 2 }).format(number(value));
    } catch (_) {
      return String(currency || '') + ' ' + round(value, 2).toLocaleString(locale || 'en');
    }
  }

  function customRateRecord(input) {
    input = input || {};
    var rate = number(input.rate);
    if (rate <= 0) return null;
    return {
      market_id: 'custom-local', country_code: input.country_code || 'CUSTOM', country_name: input.country_name || 'Custom country',
      provider_id: 'custom-local', provider_name: input.provider_name || 'User-entered provider', tariff_id: 'custom-local-rate',
      tariff_name: 'Custom local rate', customer_class: input.customer_class || 'custom', meter_type: 'user_selected', currency: input.currency || 'USD',
      billing_unit: 'kWh', pricing_model: 'flat', tiers: [{ from: 0, up_to: null, rate: rate, label: 'User-entered energy rate' }],
      fixed_charge: Math.max(0, number(input.fixed_charge)), levies: [], taxes: [], minimum_charge: 0, prepaid_deductions: [],
      effective_date: '', valid_to: null, last_verified_at: '', source_name: 'User-entered rate', source_url: '', granularity: 'custom_local',
      confidence: 'user_supplied', status: 'custom', notes: 'Stored and processed only in this browser session.'
    };
  }

  return {
    ageDays: ageDays,
    recordStatus: recordStatus,
    validateDataset: validateDataset,
    energyCost: energyCost,
    calculateBill: calculateBill,
    calculateUnits: calculateUnits,
    recordsForCountry: recordsForCountry,
    formatMoney: formatMoney,
    customRateRecord: customRateRecord,
    round: round
  };
}));
