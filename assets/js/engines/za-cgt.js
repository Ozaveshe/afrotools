(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  root.AfroTools = root.AfroTools || {};
  root.AfroTools.SouthAfricaCgt = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  var RULES = Object.freeze({
    taxYear: 2027,
    effectiveFrom: '2026-03-01',
    effectiveTo: '2027-02-28',
    annualExclusion: 50000,
    primaryResidenceExclusion: 3000000,
    individualInclusionRate: 0.4,
    otherInclusionRate: 0.8,
    companyRate: 0.27,
    trustRate: 0.45,
    individualBands: Object.freeze([
      Object.freeze({ width: 245100, rate: 0.18 }),
      Object.freeze({ width: 138000, rate: 0.26 }),
      Object.freeze({ width: 147100, rate: 0.31 }),
      Object.freeze({ width: 165600, rate: 0.36 }),
      Object.freeze({ width: 191200, rate: 0.39 }),
      Object.freeze({ width: 991600, rate: 0.41 }),
      Object.freeze({ width: Infinity, rate: 0.45 })
    ])
  });

  var formulaParameters = Object.freeze({
    taxYear: RULES.taxYear,
    effectiveFrom: RULES.effectiveFrom,
    effectiveTo: RULES.effectiveTo,
    annualExclusion: RULES.annualExclusion,
    primaryResidenceExclusion: RULES.primaryResidenceExclusion,
    individualInclusionRate: RULES.individualInclusionRate,
    otherInclusionRate: RULES.otherInclusionRate,
    companyRate: RULES.companyRate,
    trustRate: RULES.trustRate,
    individualBands: RULES.individualBands
  });

  var roundingPolicy = Object.freeze({ mode: 'none', precision: 'full JavaScript number precision; presentation rounds to cents' });

  function amount(value, name) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new RangeError(name + ' must be a non-negative finite number');
    return parsed;
  }

  function percent(value, name) {
    var parsed = amount(value, name);
    if (parsed > 100) throw new RangeError(name + ' must not exceed 100');
    return parsed / 100;
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

  function annualExclusion(value, allowance) {
    if (value > 0) return Math.max(0, value - allowance);
    if (value < 0) return Math.min(0, value + allowance);
    return 0;
  }

  function calculate(input) {
    if (!input || input.scopeConfirmed !== true) throw new Error('scope confirmation is required');
    if (!['individual', 'company', 'trust'].includes(input.taxpayerType)) throw new Error('taxpayerType is required');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.disposalDate || '') || input.disposalDate < RULES.effectiveFrom || input.disposalDate > RULES.effectiveTo) throw new Error('disposalDate must fall in the 2027 assessment year');

    var proceeds = amount(input.proceeds, 'proceeds');
    var baseCost = amount(input.acquisitionCost, 'acquisitionCost') + amount(input.acquisitionCosts, 'acquisitionCosts') + amount(input.improvementCosts, 'improvementCosts') + amount(input.disposalCosts, 'disposalCosts');
    var transactionAmount = proceeds - baseCost;
    var transactionGain = Math.max(0, transactionAmount);
    var transactionLoss = Math.max(0, -transactionAmount);
    var residenceExclusion = 0;

    if (input.assetType === 'residence' && input.taxpayerType === 'individual' && input.residenceEligible === true && transactionGain > 0) {
      var qualifyingGain = transactionGain * percent(input.qualifyingResidencePercent, 'qualifyingResidencePercent');
      var apportionedCap = RULES.primaryResidenceExclusion * percent(input.ownershipPercent, 'ownershipPercent');
      residenceExclusion = Math.min(qualifyingGain, apportionedCap);
    }

    var aggregateBeforeAnnual = transactionGain - residenceExclusion - transactionLoss + amount(input.otherCapitalGains, 'otherCapitalGains') - amount(input.currentCapitalLosses, 'currentCapitalLosses');
    var aggregateAfterAnnual = input.taxpayerType === 'individual' ? annualExclusion(aggregateBeforeAnnual, RULES.annualExclusion) : aggregateBeforeAnnual;
    var assessedLoss = amount(input.assessedCapitalLoss, 'assessedCapitalLoss');
    var netCapitalGain = Math.max(0, aggregateAfterAnnual - assessedLoss);
    var carriedCapitalLoss = aggregateAfterAnnual >= 0 ? Math.max(0, assessedLoss - aggregateAfterAnnual) : assessedLoss + Math.abs(aggregateAfterAnnual);
    var inclusionRate = input.taxpayerType === 'individual' ? RULES.individualInclusionRate : RULES.otherInclusionRate;
    var taxableCapitalGain = netCapitalGain * inclusionRate;
    var otherTaxableIncome = input.taxpayerType === 'individual' ? amount(input.otherTaxableIncome, 'otherTaxableIncome') : 0;
    var tax = 0;
    if (input.taxpayerType === 'individual') tax = individualTax(otherTaxableIncome + taxableCapitalGain) - individualTax(otherTaxableIncome);
    else tax = taxableCapitalGain * (input.taxpayerType === 'company' ? RULES.companyRate : RULES.trustRate);

    return {
      taxYear: RULES.taxYear,
      taxpayerType: input.taxpayerType,
      disposalDate: input.disposalDate,
      proceeds: proceeds,
      baseCost: baseCost,
      transactionAmount: transactionAmount,
      residenceExclusion: residenceExclusion,
      aggregateBeforeAnnual: aggregateBeforeAnnual,
      annualExclusionApplied: input.taxpayerType === 'individual' ? aggregateBeforeAnnual - aggregateAfterAnnual : 0,
      aggregateAfterAnnual: aggregateAfterAnnual,
      assessedLossUsed: Math.min(assessedLoss, Math.max(0, aggregateAfterAnnual)),
      netCapitalGain: netCapitalGain,
      carriedCapitalLoss: carriedCapitalLoss,
      inclusionRate: inclusionRate,
      taxableCapitalGain: taxableCapitalGain,
      otherTaxableIncome: otherTaxableIncome,
      tax: tax
    };
  }

  return Object.freeze({ RULES: RULES, formulaParameters: formulaParameters, roundingPolicy: roundingPolicy, annualExclusion: annualExclusion, individualTax: individualTax, calculate: calculate });
});
