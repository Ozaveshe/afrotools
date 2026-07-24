(function (root) {
  'use strict';

  var MODES = ['add', 'extract'];
  var TREATMENTS = ['standard', 'zero-rated', 'exempt'];

  function fail(error, field) {
    return { ok: false, error: error, field: field || null };
  }

  function finiteNumber(value, field, options) {
    options = options || {};
    if (value === '' || value === null || value === undefined || (typeof value === 'string' && value.trim() === '')) {
      return fail('Enter ' + field + '.', field);
    }
    var number = typeof value === 'string' ? Number(value.replace(/,/g, '').trim()) : Number(value);
    if (!Number.isFinite(number)) return fail('Enter a finite ' + field + '.', field);
    if (number < options.min || number > options.max) {
      return fail(field + ' must be between ' + options.min + ' and ' + options.max + '.', field);
    }
    return { ok: true, value: number };
  }

  function validateAmount(value, field) {
    return finiteNumber(value, field || 'amount', { min: 0, max: Number.MAX_SAFE_INTEGER });
  }

  function validateRate(value, field) {
    return finiteNumber(value, field || 'VAT rate', { min: 0, max: 100 });
  }

  function roundMoney(value) {
    return Math.round((value + Number.EPSILON) * 100) / 100;
  }

  function calculateSingle(input) {
    input = input || {};
    var amount = validateAmount(input.amount, 'amount');
    if (!amount.ok) return amount;
    var rate = validateRate(input.rate, 'VAT rate');
    if (!rate.ok) return rate;
    var mode = MODES.indexOf(input.mode) >= 0 ? input.mode : 'add';
    var ratio = rate.value / 100;
    var net;
    var vat;
    var total;

    if (mode === 'extract') {
      total = amount.value;
      net = total / (1 + ratio);
      vat = total - net;
    } else {
      net = amount.value;
      vat = net * ratio;
      total = net + vat;
    }

    return {
      ok: true,
      mode: mode,
      amount: amount.value,
      rate: rate.value,
      net: net,
      vat: vat,
      total: total,
      display: { net: roundMoney(net), vat: roundMoney(vat), total: roundMoney(total) }
    };
  }

  function calculateInvoice(input) {
    input = input || {};
    if (!Array.isArray(input.items) || input.items.length === 0) {
      return fail('Add at least one invoice line.', 'items');
    }
    var lines = [];
    var subtotal = 0;
    var vatTotal = 0;

    for (var index = 0; index < input.items.length; index += 1) {
      var item = input.items[index] || {};
      var amount = validateAmount(item.amount, 'items[' + index + '].amount');
      if (!amount.ok) return amount;
      var treatment = TREATMENTS.indexOf(item.treatment) >= 0 ? item.treatment : 'standard';
      var rateValue = 0;
      if (treatment === 'standard') {
        var rate = validateRate(item.rate, 'items[' + index + '].rate');
        if (!rate.ok) return rate;
        rateValue = rate.value;
      }
      var vat = amount.value * rateValue / 100;
      subtotal += amount.value;
      vatTotal += vat;
      lines.push({
        description: String(item.description || ''),
        amount: amount.value,
        treatment: treatment,
        rate: rateValue,
        vat: vat,
        total: amount.value + vat,
        display: { amount: roundMoney(amount.value), vat: roundMoney(vat), total: roundMoney(amount.value + vat) }
      });
    }

    return {
      ok: true,
      lines: lines,
      subtotal: subtotal,
      vat: vatTotal,
      total: subtotal + vatTotal,
      display: { subtotal: roundMoney(subtotal), vat: roundMoney(vatTotal), total: roundMoney(subtotal + vatTotal) }
    };
  }

  function calculateWithholdingScenario(input) {
    input = input || {};
    var base = calculateSingle({ amount: input.netAmount, rate: input.vatRate, mode: 'add' });
    if (!base.ok) return base;
    var withholding = finiteNumber(input.withholdingPercent, 'withholding percentage', { min: 0, max: 100 });
    if (!withholding.ok) return withholding;
    var retained = base.vat * withholding.value / 100;
    var supplierReceives = base.total - retained;
    return {
      ok: true,
      net: base.net,
      vatRate: base.rate,
      vat: base.vat,
      total: base.total,
      withholdingPercent: withholding.value,
      retainedVat: retained,
      remainingVat: base.vat - retained,
      supplierReceives: supplierReceives,
      display: {
        net: roundMoney(base.net), vat: roundMoney(base.vat), total: roundMoney(base.total),
        retainedVat: roundMoney(retained), remainingVat: roundMoney(base.vat - retained),
        supplierReceives: roundMoney(supplierReceives)
      }
    };
  }

  function compareRateScenarios(input) {
    input = input || {};
    var amount = validateAmount(input.amount, 'amount');
    if (!amount.ok) return amount;
    if (!Array.isArray(input.scenarios) || input.scenarios.length < 2) {
      return fail('Add at least two rate scenarios.', 'scenarios');
    }
    var scenarios = [];
    for (var index = 0; index < input.scenarios.length; index += 1) {
      var scenario = input.scenarios[index] || {};
      var result = calculateSingle({ amount: amount.value, rate: scenario.rate, mode: 'add' });
      if (!result.ok) {
        result.field = 'scenarios[' + index + '].rate';
        return result;
      }
      scenarios.push({ label: String(scenario.label || ('Scenario ' + (index + 1))), rate: result.rate, vat: result.vat, total: result.total });
    }
    var rates = scenarios.map(function (scenario) { return scenario.rate; });
    return {
      ok: true,
      amount: amount.value,
      scenarios: scenarios,
      percentagePointSpread: Math.max.apply(Math, rates) - Math.min.apply(Math, rates)
    };
  }

  function getCountryPreset(pack, countryCode) {
    var code = String(countryCode || '').trim().toUpperCase();
    var country = pack && pack.countries && pack.countries[code];
    if (!country) return fail('Choose a supported country.', 'country');
    if (country.status !== 'authority-bound-planning-preset' || !Number.isFinite(country.standardRate)) {
      return {
        ok: false,
        field: 'rate',
        countryCode: code,
        status: country.status,
        error: 'No authority-bound preset is available. Enter the rate from your authority notice.'
      };
    }
    return {
      ok: true,
      countryCode: code,
      countryName: country.name,
      currencyLabel: country.currencyLabel,
      rate: country.standardRate,
      status: country.status,
      source: country.source,
      reviewedOn: pack.datasetReviewed,
      disclaimer: pack.displayDisclaimer
    };
  }

  var engine = {
    modes: MODES.slice(),
    treatments: TREATMENTS.slice(),
    roundingPolicy: 'Keep full-precision arithmetic through totals; round only display values to two decimal places.',
    validateAmount: validateAmount,
    validateRate: validateRate,
    roundMoney: roundMoney,
    calculateSingle: calculateSingle,
    calculateInvoice: calculateInvoice,
    calculateWithholdingScenario: calculateWithholdingScenario,
    compareRateScenarios: compareRateScenarios,
    getCountryPreset: getCountryPreset
  };

  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.panAfricanVat = engine;
  }
}(typeof window !== 'undefined' ? window : globalThis));
