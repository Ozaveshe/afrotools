(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.propertyTransferQuote = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  var MAX = 1000000000000000;
  var COST_FIELDS = ['transferTax', 'legalFees', 'registrationFees', 'valuationFees', 'agentFees', 'lenderFees', 'otherCosts'];

  function amount(value, field, allowZero) {
    var number = Number(value);
    if (!Number.isFinite(number) || number < 0 || number > MAX || (!allowZero && number === 0)) {
      throw new RangeError(field + ' must be ' + (allowZero ? 'between 0 and ' : 'above 0 and no more than ') + MAX + '.');
    }
    return number;
  }
  function reconcile(input) {
    input = input || {};
    var values = { purchasePrice: amount(input.purchasePrice, 'purchasePrice', false) };
    COST_FIELDS.forEach(function (field) { values[field] = amount(input[field], field, true); });
    var totalTransferCosts = COST_FIELDS.reduce(function (sum, field) { return sum + values[field]; }, 0);
    var quotedLineCount = COST_FIELDS.filter(function (field) { return values[field] > 0; }).length;
    return {
      input: values,
      totalTransferCosts: totalTransferCosts,
      transferCostShare: totalTransferCosts / values.purchasePrice,
      purchasePlusCosts: values.purchasePrice + totalTransferCosts,
      quotedLineCount: quotedLineCount,
      unquotedLineCount: COST_FIELDS.length - quotedLineCount,
      lineItems: COST_FIELDS.map(function (field) { return { field: field, amount: values[field], quoted: values[field] > 0 }; })
    };
  }
  return {
    reconcile: reconcile,
    costFields: COST_FIELDS.slice(),
    limits: { maximumAmount: MAX },
    formulaParameters: {
      scope: 'Arithmetic reconciliation of user-entered written quotes only.',
      totalTransferCosts: 'sum of entered transfer-tax, legal, registration, valuation, agent, lender and other quote amounts',
      transferCostShare: 'total entered transfer costs / purchase price',
      purchasePlusCosts: 'purchase price + total entered transfer costs',
      zeroBoundary: 'A zero line means no positive quote amount has been entered; it does not prove that the charge is legally zero.',
      statutoryBoundary: 'No rate, exemption, buyer/seller allocation, legal classification, deadline or filing result is supplied.'
    }
  };
});
