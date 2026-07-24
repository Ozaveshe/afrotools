(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.KenyaCgt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var RULES = Object.freeze({
    rate: 0.15,
    rateEffectiveFrom: '2023-01-01',
    lawVersion: 'Income Tax Act (Cap. 470), version 2026-01-01',
    reviewedAt: '2026-07-22'
  });

  var formulaParameters = Object.freeze({
    rate: RULES.rate,
    rateEffectiveFrom: RULES.rateEffectiveFrom,
    netTransferValue: 'transfer value minus incidental transfer costs',
    adjustedCost: 'acquisition cost plus incidental acquisition, enhancement and preservation costs',
    taxableGain: 'maximum of zero and net transfer value minus adjusted cost'
  });

  var roundingPolicy = Object.freeze({
    mode: 'none',
    precision: 'full JavaScript number precision; presentation rounds to two currency decimals'
  });

  function amount(value, name) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) {
      throw new RangeError(name + ' must be a non-negative finite number');
    }
    return parsed;
  }

  function calculate(input) {
    if (!input || input.scopeConfirmed !== true) throw new Error('scope confirmation is required');
    if (input.exemptionClaimed === true && input.exemptionConfirmed !== true) {
      throw new Error('claimed exemption must be confirmed');
    }

    var transferValue = amount(input.transferValue, 'transferValue');
    var acquisitionCost = amount(input.acquisitionCost, 'acquisitionCost');
    var acquisitionCosts = amount(input.acquisitionCosts, 'acquisitionCosts');
    var enhancementCosts = amount(input.enhancementCosts, 'enhancementCosts');
    var preservationCosts = amount(input.preservationCosts, 'preservationCosts');
    var transferCosts = amount(input.transferCosts, 'transferCosts');
    var netTransferValue = Math.max(0, transferValue - transferCosts);
    var adjustedCost = acquisitionCost + acquisitionCosts + enhancementCosts + preservationCosts;
    var rawGain = Math.max(0, netTransferValue - adjustedCost);
    var exempt = input.exemptionClaimed === true && input.exemptionConfirmed === true;
    var taxableGain = exempt ? 0 : rawGain;
    var tax = taxableGain * RULES.rate;

    return Object.freeze({
      transferValue: transferValue,
      transferCosts: transferCosts,
      netTransferValue: netTransferValue,
      adjustedCost: adjustedCost,
      rawGain: rawGain,
      taxableGain: taxableGain,
      tax: tax,
      netProceedsAfterTax: transferValue - transferCosts - tax,
      exempt: exempt,
      rate: RULES.rate,
      reviewedAt: RULES.reviewedAt
    });
  }

  return Object.freeze({
    RULES: RULES,
    formulaParameters: formulaParameters,
    roundingPolicy: roundingPolicy,
    calculate: calculate
  });
});
