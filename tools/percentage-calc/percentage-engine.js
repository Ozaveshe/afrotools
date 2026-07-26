(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroPercentageEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value, label) {
    if (value === '' || value === null || value === undefined) {
      return { ok: false, error: label + ' is required.' };
    }
    var parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return { ok: false, error: label + ' must be a finite number.' };
    }
    return { ok: true, value: parsed };
  }

  function values(fields) {
    var output = {};
    for (var i = 0; i < fields.length; i += 1) {
      var parsed = number(fields[i].value, fields[i].label);
      if (!parsed.ok) return parsed;
      output[fields[i].key] = parsed.value;
    }
    return { ok: true, values: output };
  }

  function error(message) {
    return { ok: false, error: message };
  }

  function percentOf(percent, base) {
    var parsed = values([
      { key: 'percent', value: percent, label: 'Percentage' },
      { key: 'base', value: base, label: 'Base value' }
    ]);
    if (!parsed.ok) return parsed;
    return { ok: true, result: parsed.values.percent * parsed.values.base / 100 };
  }

  function percentageOf(value, total) {
    var parsed = values([
      { key: 'value', value: value, label: 'Value' },
      { key: 'total', value: total, label: 'Total' }
    ]);
    if (!parsed.ok) return parsed;
    if (parsed.values.total === 0) return error('Total cannot be zero.');
    return { ok: true, percentage: parsed.values.value / parsed.values.total * 100 };
  }

  function percentageChange(original, next) {
    var parsed = values([
      { key: 'original', value: original, label: 'Original value' },
      { key: 'next', value: next, label: 'New value' }
    ]);
    if (!parsed.ok) return parsed;
    if (parsed.values.original === 0) {
      return error('Percentage change is undefined when the original value is zero.');
    }
    var difference = parsed.values.next - parsed.values.original;
    return {
      ok: true,
      difference: difference,
      percentage: difference / Math.abs(parsed.values.original) * 100
    };
  }

  function discount(price, percent) {
    var parsed = values([
      { key: 'price', value: price, label: 'Original price' },
      { key: 'percent', value: percent, label: 'Discount' }
    ]);
    if (!parsed.ok) return parsed;
    if (parsed.values.price < 0) return error('Original price cannot be negative.');
    if (parsed.values.percent < 0 || parsed.values.percent > 100) {
      return error('Discount must be between 0% and 100%.');
    }
    var saving = parsed.values.price * parsed.values.percent / 100;
    return {
      ok: true,
      saving: saving,
      finalPrice: parsed.values.price - saving,
      percentage: parsed.values.percent
    };
  }

  function tipSplit(bill, tipPercent, people) {
    var parsed = values([
      { key: 'bill', value: bill, label: 'Bill amount' },
      { key: 'tipPercent', value: tipPercent, label: 'Tip percentage' },
      { key: 'people', value: people, label: 'Number of people' }
    ]);
    if (!parsed.ok) return parsed;
    if (parsed.values.bill < 0) return error('Bill amount cannot be negative.');
    if (parsed.values.tipPercent < 0) return error('Tip percentage cannot be negative.');
    if (!Number.isInteger(parsed.values.people) || parsed.values.people < 1) {
      return error('Number of people must be a whole number of at least 1.');
    }
    var tip = parsed.values.bill * parsed.values.tipPercent / 100;
    var total = parsed.values.bill + tip;
    return {
      ok: true,
      tip: tip,
      total: total,
      perPerson: total / parsed.values.people
    };
  }

  function margin(cost, sellingPrice) {
    var parsed = values([
      { key: 'cost', value: cost, label: 'Cost price' },
      { key: 'sellingPrice', value: sellingPrice, label: 'Selling price' }
    ]);
    if (!parsed.ok) return parsed;
    if (parsed.values.cost < 0) return error('Cost price cannot be negative.');
    if (parsed.values.sellingPrice <= 0) return error('Selling price must be greater than zero.');
    var profit = parsed.values.sellingPrice - parsed.values.cost;
    return {
      ok: true,
      profit: profit,
      margin: profit / parsed.values.sellingPrice * 100,
      marginRatio: profit / parsed.values.sellingPrice,
      markup: parsed.values.cost === 0 ? null : profit / parsed.values.cost * 100
    };
  }

  return {
    number: number,
    percentOf: percentOf,
    percentageOf: percentageOf,
    percentageChange: percentageChange,
    discount: discount,
    tipSplit: tipSplit,
    margin: margin
  };
}));
