(function (root, factory) {
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.cryptoCgt = engine;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  var RULES = {
    NG: { country: 'Nigeria', currency: 'NGN', year: '2026 calendar year', start: '2026-01-01', end: '2026-12-31' },
    KE: { country: 'Kenya', currency: 'KES', year: '2026 calendar year', start: '2026-01-01', end: '2026-12-31' },
    ZA: { country: 'South Africa', currency: 'ZAR', year: '2027 year of assessment', start: '2026-03-01', end: '2027-02-28' },
    GH: { country: 'Ghana', currency: 'GHS', year: '2026 calendar year', start: '2026-01-01', end: '2026-12-31' }
  };
  var NG_BANDS = [
    { width: 800000, rate: 0 }, { width: 2200000, rate: 0.15 }, { width: 9000000, rate: 0.18 },
    { width: 13000000, rate: 0.21 }, { width: 25000000, rate: 0.23 }, { width: Infinity, rate: 0.25 }
  ];
  var ZA_BANDS = [
    { width: 245100, rate: 0.18 }, { width: 138000, rate: 0.26 }, { width: 147100, rate: 0.31 },
    { width: 165600, rate: 0.36 }, { width: 191200, rate: 0.39 }, { width: 991600, rate: 0.41 }, { width: Infinity, rate: 0.45 }
  ];

  function number(value, label) {
    var parsed = Number(value == null || value === '' ? 0 : value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(label + ' must be zero or more.');
    return parsed;
  }
  function bandTax(amount, bands) {
    var left = Math.max(0, amount), tax = 0;
    bands.forEach(function (band) { var slice = Math.min(left, band.width); tax += slice * band.rate; left -= slice; });
    return tax;
  }
  function requireScope(input) {
    var rule = RULES[input.country];
    if (!rule) throw new Error('Choose Nigeria, Kenya, South Africa or Ghana.');
    if (input.taxpayerType !== 'individual') throw new Error('This estimator supports individuals only. Companies and trusts need a separate review.');
    if (input.classification !== 'capital-confirmed') throw new Error('No estimate produced: confirm with a qualified adviser or the tax authority that this event is treated on capital account. Trading, business, mining, staking, rewards and uncertain cases are outside this calculator.');
    if (input.scopeConfirmed !== true) throw new Error('Confirm the scope statement before calculating.');
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.disposalDate || '') || input.disposalDate < rule.start || input.disposalDate > rule.end) {
      throw new Error('The disposal date must fall within the supported ' + rule.year + ' (' + rule.start + ' to ' + rule.end + ').');
    }
    return rule;
  }
  function annualExclusion(net) {
    if (net > 0) return Math.max(0, net - 50000);
    if (net < 0) return Math.min(0, net + 50000);
    return 0;
  }

  function calculate(input) {
    input = input || {};
    var rule = requireScope(input);
    var proceeds = number(input.proceeds, 'Proceeds or market value');
    var acquisitionCost = number(input.acquisitionCost, 'Acquisition cost');
    var acquisitionCosts = number(input.acquisitionCosts, 'Acquisition costs');
    var disposalCosts = number(input.disposalCosts, 'Disposal costs');
    var baseCost = acquisitionCost + acquisitionCosts + disposalCosts;
    var transactionGain = proceeds - baseCost;
    var taxableBase = 0, tax = 0, details = {};

    if (input.country === 'NG') {
      var otherIncome = number(input.otherChargeableIncome, 'Other chargeable income');
      taxableBase = Math.max(0, transactionGain);
      tax = bandTax(otherIncome + taxableBase, NG_BANDS) - bandTax(otherIncome, NG_BANDS);
      details = { otherChargeableIncome: otherIncome, method: 'Incremental individual income tax under Nigeria Tax Act 2025 bands' };
    } else if (input.country === 'KE') {
      taxableBase = Math.max(0, transactionGain);
      tax = taxableBase * 0.15;
      details = { rate: 0.15, method: '15% final capital gains tax after confirmed Eighth Schedule treatment' };
    } else if (input.country === 'GH') {
      taxableBase = Math.max(0, transactionGain);
      tax = taxableBase * 0.15;
      details = { rate: 0.15, method: '15% individual isolated-transaction capital gains treatment' };
    } else {
      var otherGains = number(input.otherCapitalGains, 'Other capital gains');
      var currentLosses = number(input.currentCapitalLosses, 'Current capital losses');
      var assessedLoss = number(input.assessedCapitalLoss, 'Assessed capital loss');
      var otherTaxableIncome = number(input.otherTaxableIncome, 'Other taxable income');
      var aggregate = transactionGain + otherGains - currentLosses;
      var afterExclusion = annualExclusion(aggregate);
      var netCapitalGain = Math.max(0, afterExclusion - assessedLoss);
      var carriedLoss = Math.max(0, assessedLoss - Math.max(0, afterExclusion)) + Math.max(0, -afterExclusion);
      taxableBase = netCapitalGain * 0.4;
      tax = bandTax(otherTaxableIncome + taxableBase, ZA_BANDS) - bandTax(otherTaxableIncome, ZA_BANDS);
      details = { otherCapitalGains: otherGains, currentCapitalLosses: currentLosses, aggregateGainOrLoss: aggregate, annualExclusion: 50000, afterAnnualExclusion: afterExclusion, assessedCapitalLossUsed: Math.min(assessedLoss, Math.max(0, afterExclusion)), carriedCapitalLoss: carriedLoss, inclusionRate: 0.4, otherTaxableIncome: otherTaxableIncome, method: '40% individual inclusion after the R50,000 annual exclusion and available losses' };
    }

    return {
      country: input.country, countryName: rule.country, currency: rule.currency, taxYear: rule.year,
      proceeds: proceeds, baseCost: baseCost, transactionGain: transactionGain, capitalGain: Math.max(0, transactionGain), capitalLoss: Math.max(0, -transactionGain),
      taxableBase: taxableBase, estimatedTax: Math.max(0, tax), afterTaxProceeds: proceeds - Math.max(0, tax), classification: input.classification, details: details
    };
  }

  return {
    calculate: calculate,
    rules: RULES,
    formulaParameters: {
      scope: 'Individuals with explicitly confirmed capital-account treatment only; unsupported classifications fail closed.',
      NG: { effective: '2026-01-01', individualBands: NG_BANDS },
      KE: { effective: '2025-07-01', capitalGainsRate: 0.15, digitalAssetTaxRepealed: true, providerFeeExciseExcluded: true },
      ZA: { assessmentYear: '2027', annualExclusion: 50000, individualInclusionRate: 0.4, individualBands: ZA_BANDS },
      GH: { taxYear: '2026', isolatedIndividualCapitalGainRate: 0.15 }
    },
    roundingPolicy: { method: 'unrounded-decimal', precision: 'Full JavaScript number precision; presentation rounds to two currency decimals.', stages: ['No intermediate statutory rounding is applied.'] }
  };
});
