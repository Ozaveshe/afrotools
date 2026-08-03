(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.swZakat = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var MAX_VALUE = 1000000000000000;
  var ASSET_KEYS = ['cash', 'savings', 'goldGrams', 'goldPrice', 'silverGrams', 'silverPrice', 'inventory', 'investments', 'receivables', 'debts', 'customNisab'];

  function amount(value, field) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > MAX_VALUE) {
      var error = new RangeError(field + ' must be between 0 and ' + MAX_VALUE + '.');
      error.field = field;
      error.code = 'INVALID_AMOUNT';
      throw error;
    }
    return number;
  }

  function calculate(input) {
    input = input || {};
    var values = {};
    ASSET_KEYS.forEach(function (key) { values[key] = amount(input[key] || 0, key); });
    if (!['silver', 'gold', 'custom'].includes(input.nisabBasis)) {
      var basisError = new Error('nisabBasis is unsupported.');
      basisError.field = 'nisabBasis';
      basisError.code = 'INVALID_BASIS';
      throw basisError;
    }
    if (input.nisabBasis === 'gold' && values.goldPrice <= 0) {
      var goldError = new Error('goldPrice must be greater than 0 for gold nisab.');
      goldError.field = 'goldPrice';
      goldError.code = 'ZERO_PRICE';
      throw goldError;
    }
    if (input.nisabBasis === 'silver' && values.silverPrice <= 0) {
      var silverError = new Error('silverPrice must be greater than 0 for silver nisab.');
      silverError.field = 'silverPrice';
      silverError.code = 'ZERO_PRICE';
      throw silverError;
    }
    if (input.nisabBasis === 'custom' && values.customNisab <= 0) {
      var customError = new Error('customNisab must be greater than 0.');
      customError.field = 'customNisab';
      customError.code = 'ZERO_NISAB';
      throw customError;
    }
    if (input.hawlDate && !/^\d{4}-\d{2}-\d{2}$/.test(input.hawlDate)) {
      var dateError = new Error('hawlDate must be a valid date.');
      dateError.field = 'hawlDate';
      dateError.code = 'INVALID_DATE';
      throw dateError;
    }

    var assets = {
      cash: values.cash,
      savings: values.savings,
      goldValue: values.goldGrams * values.goldPrice,
      silverValue: values.silverGrams * values.silverPrice,
      inventory: values.inventory,
      investments: values.investments,
      receivables: values.receivables
    };
    var grossAssets = Object.keys(assets).reduce(function (sum, key) { return sum + assets[key]; }, 0);
    var zakatableWealth = Math.max(0, grossAssets - values.debts);
    var goldNisab = 85 * values.goldPrice;
    var silverNisab = 595 * values.silverPrice;
    var nisab = input.nisabBasis === 'gold' ? goldNisab : input.nisabBasis === 'custom' ? values.customNisab : silverNisab;
    var aboveNisab = zakatableWealth >= nisab;
    var hawlMet = input.hawlMet === true;

    return {
      input: {
        currency: input.currency,
        nisabBasis: input.nisabBasis,
        hawlDate: input.hawlDate || '',
        hawlMet: hawlMet,
        values: values
      },
      assets: assets,
      grossAssets: grossAssets,
      debts: values.debts,
      zakatableWealth: zakatableWealth,
      goldNisab: goldNisab,
      silverNisab: silverNisab,
      nisab: nisab,
      aboveNisab: aboveNisab,
      remainingToNisab: Math.max(0, nisab - zakatableWealth),
      hawlMet: hawlMet,
      zakatDue: aboveNisab && hawlMet ? zakatableWealth * 0.025 : 0
    };
  }

  return {
    calculate: calculate,
    limits: { maximumValue: MAX_VALUE, goldNisabGrams: 85, silverNisabGrams: 595, zakatRate: 0.025 },
    formula: 'max(0, cash + savings + gold grams x gold price + silver grams x silver price + inventory + investments + receivables - short-term debts)',
    sourceReviewedOn: '2026-05-16'
  };
});
