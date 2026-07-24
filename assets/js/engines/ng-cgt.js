(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.NigeriaCgt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var RULES = Object.freeze({
    effectiveFrom: '2026-01-01',
    shareProceedsThreshold: 150000000,
    shareGainThreshold: 10000000,
    smallCompanyTurnover: 50000000,
    smallCompanyAssets: 250000000,
    companyRate: 0.30,
    individualBands: Object.freeze([
      Object.freeze({ width: 800000, rate: 0 }),
      Object.freeze({ width: 2200000, rate: 0.15 }),
      Object.freeze({ width: 9000000, rate: 0.18 }),
      Object.freeze({ width: 13000000, rate: 0.21 }),
      Object.freeze({ width: 25000000, rate: 0.23 }),
      Object.freeze({ width: Infinity, rate: 0.25 })
    ])
  });

  var formulaParameters = Object.freeze({
    effectiveFrom: RULES.effectiveFrom,
    shareProceedsThreshold: RULES.shareProceedsThreshold,
    shareGainThreshold: RULES.shareGainThreshold,
    smallCompanyTurnover: RULES.smallCompanyTurnover,
    smallCompanyAssets: RULES.smallCompanyAssets,
    companyRate: RULES.companyRate,
    individualBands: RULES.individualBands
  });

  var roundingPolicy = Object.freeze({
    mode: 'none',
    precision: 'full JavaScript number precision; presentation is locale-formatted without altering the result'
  });

  function amount(value, name) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(name + ' must be a non-negative finite number');
    return parsed;
  }

  function individualTax(income) {
    var remaining = amount(income, 'income');
    var tax = 0;
    for (var i = 0; i < RULES.individualBands.length && remaining > 0; i += 1) {
      var band = RULES.individualBands[i];
      var slice = Math.min(remaining, band.width);
      tax += slice * band.rate;
      remaining -= slice;
    }
    return tax;
  }

  function calculate(input) {
    if (!input || input.scopeConfirmed !== true) throw new Error('scope confirmation is required');
    if (input.sellerType !== 'individual' && input.sellerType !== 'company') throw new Error('sellerType is required');
    var proceeds = amount(input.proceeds, 'proceeds');
    var acquisitionCost = amount(input.acquisitionCost, 'acquisitionCost');
    var disposalCosts = amount(input.disposalCosts, 'disposalCosts');
    var rawGain = Math.max(0, proceeds - acquisitionCost - disposalCosts);
    var taxableGain = rawGain;
    var relief = 'none';

    if (input.assetType === 'residence') {
      if (input.sellerType === 'individual' && input.residenceEligible === true) {
        taxableGain = 0;
        relief = 'principal-residence';
      } else {
        relief = 'residence-review';
      }
    } else if (input.assetType === 'shares') {
      var aggregateShareProceeds = amount(input.aggregateShareProceeds, 'aggregateShareProceeds');
      var aggregateShareGain = amount(input.aggregateShareGain, 'aggregateShareGain');
      var reinvestedProceeds = Math.min(amount(input.reinvestedProceeds, 'reinvestedProceeds'), proceeds);
      if (aggregateShareProceeds < RULES.shareProceedsThreshold && aggregateShareGain <= RULES.shareGainThreshold) {
        taxableGain = 0;
        relief = 'share-threshold';
      } else if (proceeds > 0 && reinvestedProceeds > 0) {
        taxableGain = rawGain * ((proceeds - reinvestedProceeds) / proceeds);
        relief = 'share-reinvestment';
      }
    }

    var tax = 0;
    var rateLabel = '';
    var smallCompany = false;
    var otherIncome = 0;
    if (input.sellerType === 'company') {
      var turnover = amount(input.turnover, 'turnover');
      var fixedAssets = amount(input.fixedAssets, 'fixedAssets');
      smallCompany = turnover <= RULES.smallCompanyTurnover && fixedAssets <= RULES.smallCompanyAssets && input.professionalServices !== true;
      tax = taxableGain * (smallCompany ? 0 : RULES.companyRate);
      rateLabel = smallCompany ? '0%' : '30%';
    } else {
      otherIncome = amount(input.otherChargeableIncome, 'otherChargeableIncome');
      tax = individualTax(otherIncome + taxableGain) - individualTax(otherIncome);
      rateLabel = 'progressive 0–25%';
    }

    return {
      regime: RULES.effectiveFrom,
      sellerType: input.sellerType,
      assetType: input.assetType,
      proceeds: proceeds,
      acquisitionCost: acquisitionCost,
      disposalCosts: disposalCosts,
      rawGain: rawGain,
      taxableGain: taxableGain,
      tax: tax,
      rateLabel: rateLabel,
      relief: relief,
      smallCompany: smallCompany,
      otherChargeableIncome: otherIncome
    };
  }

  return Object.freeze({
    RULES: RULES,
    formulaParameters: formulaParameters,
    roundingPolicy: roundingPolicy,
    calculate: calculate,
    individualTax: individualTax
  });
});
