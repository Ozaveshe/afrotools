(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.investmentReturn = engine;
  }
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';

  var COMPOUNDING = [1, 4, 12];

  function finite(value, field) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new RangeError(field + ' must be a finite number.');
    return number;
  }

  function normalize(input) {
    input = input || {};
    var initialInvestment = finite(input.initialInvestment, 'initialInvestment');
    var monthlyContribution = finite(input.monthlyContribution, 'monthlyContribution');
    var annualRatePercent = finite(input.annualRatePercent, 'annualRatePercent');
    var years = finite(input.years, 'years');
    var compoundsPerYear = Math.floor(finite(input.compoundsPerYear == null ? 12 : input.compoundsPerYear, 'compoundsPerYear'));
    var inflationRatePercent = finite(input.inflationRatePercent == null ? 0 : input.inflationRatePercent, 'inflationRatePercent');
    var contributionTiming = input.contributionTiming === 'beginning' ? 'beginning' : 'end';

    if (initialInvestment < 0) throw new RangeError('initialInvestment must be zero or greater.');
    if (monthlyContribution < 0) throw new RangeError('monthlyContribution must be zero or greater.');
    if (initialInvestment === 0 && monthlyContribution === 0) throw new RangeError('Enter an initial investment or monthly contribution.');
    if (annualRatePercent <= -100 || annualRatePercent > 1000) throw new RangeError('annualRatePercent must be above -100 and no more than 1000.');
    if (years < 1 / 12 || years > 100) throw new RangeError('years must be between one month and 100 years.');
    if (COMPOUNDING.indexOf(compoundsPerYear) === -1) throw new RangeError('compoundsPerYear must be 1, 4, or 12.');
    if (inflationRatePercent <= -100 || inflationRatePercent > 1000) throw new RangeError('inflationRatePercent must be above -100 and no more than 1000.');

    return {
      initialInvestment: initialInvestment,
      monthlyContribution: monthlyContribution,
      annualRatePercent: annualRatePercent,
      years: Math.round(years * 12) / 12,
      months: Math.max(1, Math.round(years * 12)),
      compoundsPerYear: compoundsPerYear,
      contributionTiming: contributionTiming,
      inflationRatePercent: inflationRatePercent
    };
  }

  function project(input) {
    var values = normalize(input);
    var nominalRate = values.annualRatePercent / 100;
    var periodicRate = nominalRate / values.compoundsPerYear;
    var monthlyRate = Math.pow(1 + periodicRate, values.compoundsPerYear / 12) - 1;
    var effectiveAnnualRate = Math.pow(1 + periodicRate, values.compoundsPerYear) - 1;
    var balance = values.initialInvestment;
    var totalContributed = values.initialInvestment;
    var yearData = [];

    for (var month = 1; month <= values.months; month += 1) {
      if (values.contributionTiming === 'beginning') {
        balance += values.monthlyContribution;
        totalContributed += values.monthlyContribution;
      }
      balance *= 1 + monthlyRate;
      if (values.contributionTiming === 'end') {
        balance += values.monthlyContribution;
        totalContributed += values.monthlyContribution;
      }
      if (month % 12 === 0 || month === values.months) {
        yearData.push({
          month: month,
          year: month / 12,
          totalContributed: totalContributed,
          projectedGain: balance - totalContributed,
          balance: balance
        });
      }
    }

    var projectedGain = balance - totalContributed;
    var gainOnContributions = totalContributed ? projectedGain / totalContributed : 0;
    var inflationRate = values.inflationRatePercent / 100;
    var purchasingPowerValue = balance / Math.pow(1 + inflationRate, values.months / 12);
    var realEffectiveAnnualRate = (1 + effectiveAnnualRate) / (1 + inflationRate) - 1;
    var lumpSumCagr = values.monthlyContribution === 0 && values.initialInvestment > 0
      ? Math.pow(balance / values.initialInvestment, 12 / values.months) - 1
      : null;
    var doublingYears = effectiveAnnualRate > 0 ? Math.log(2) / Math.log(1 + effectiveAnnualRate) : null;

    return {
      input: values,
      nominalAnnualRate: nominalRate,
      periodicRate: periodicRate,
      monthlyEquivalentRate: monthlyRate,
      effectiveAnnualRate: effectiveAnnualRate,
      realEffectiveAnnualRate: realEffectiveAnnualRate,
      finalValue: balance,
      totalContributed: totalContributed,
      projectedGain: projectedGain,
      gainOnContributions: gainOnContributions,
      purchasingPowerValue: purchasingPowerValue,
      lumpSumCagr: lumpSumCagr,
      doublingYears: doublingYears,
      yearData: yearData
    };
  }

  function sensitivity(input, deltaPercent) {
    var values = normalize(input);
    var delta = Math.abs(finite(deltaPercent == null ? 2 : deltaPercent, 'deltaPercent'));
    var rates = [
      Math.max(-99.99, values.annualRatePercent - delta),
      values.annualRatePercent,
      Math.min(1000, values.annualRatePercent + delta)
    ];
    return rates.map(function (rate, index) {
      var result = project(Object.assign({}, values, { annualRatePercent: rate }));
      return { label: index === 0 ? 'Lower' : index === 1 ? 'Entered' : 'Higher', annualRatePercent: rate, finalValue: result.finalValue };
    });
  }

  return {
    project: project,
    sensitivity: sensitivity,
    formulaParameters: {
      contributionCadence: 'monthly',
      contributionTiming: ['end', 'beginning'],
      compoundingFrequenciesPerYear: COMPOUNDING,
      realReturnMethod: '(1 + effective annual return) / (1 + inflation) - 1'
    },
    roundingPolicy: {
      method: 'full-precision-then-display',
      precision: 'Calculations retain JavaScript floating-point precision; currency displays round to two decimals.',
      stages: ['Normalize the entered years to whole months.', 'Project each month at the equivalent monthly rate.', 'Round only user-facing currency and percentage displays.']
    }
  };
});
