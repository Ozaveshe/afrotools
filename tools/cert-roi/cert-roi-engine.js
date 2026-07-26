(function (root, factory) {
  'use strict';
  var engine = factory();
  if (typeof module === 'object' && module.exports) module.exports = engine;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.certRoiEngine = engine;
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  function numeric(value) {
    if (value === '' || value === null || value === undefined) return 0;
    var parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : NaN;
  }

  function calculate(input) {
    input = input || {};
    var directCost = numeric(input.directCost);
    var otherCost = numeric(input.otherCost);
    var studyHours = numeric(input.studyHours);
    var hourValue = numeric(input.hourValue);
    var annualUplift = numeric(input.annualUplift);
    var studyMonths = numeric(input.studyMonths);
    var delayMonths = numeric(input.delayMonths);
    var horizonYears = numeric(input.horizonYears);
    var values = [directCost, otherCost, studyHours, hourValue, annualUplift, studyMonths, delayMonths, horizonYears];
    var errors = [];

    if (values.some(function (value) { return !Number.isFinite(value) || value < 0; })) {
      errors.push('All numeric entries must be zero or greater.');
    }
    if (!Number.isFinite(horizonYears) || horizonYears < 1 || horizonYears > 10) {
      errors.push('Analysis horizon must be between 1 and 10 years.');
    }
    if (Number.isFinite(studyMonths) && studyMonths > 120) {
      errors.push('Time to completion must be no more than 120 months.');
    }
    if (Number.isFinite(delayMonths) && delayMonths > 120) {
      errors.push('Delay after completion must be no more than 120 months.');
    }
    if (Number.isFinite(studyHours) && studyHours > 20000) {
      errors.push('Study hours must be no more than 20,000.');
    }
    if (errors.length) return { ok: false, errors: Array.from(new Set(errors)) };

    var timeCost = studyHours * hourValue;
    var totalInvestment = directCost + otherCost + timeCost;
    if (totalInvestment <= 0) {
      return { ok: false, errors: ['Enter at least one direct cost or a value for study time.'] };
    }

    var horizonMonths = horizonYears * 12;
    var earningStartMonth = studyMonths + delayMonths;
    var activeEarningMonths = Math.max(0, horizonMonths - earningStartMonth);
    var monthlyUplift = annualUplift / 12;
    var grossUplift = monthlyUplift * activeEarningMonths;
    var netGain = grossUplift - totalInvestment;
    var roiPercent = (netGain / totalInvestment) * 100;
    var paybackEarningMonths = monthlyUplift > 0 ? totalInvestment / monthlyUplift : null;
    var calendarPaybackMonths = paybackEarningMonths === null ? null : earningStartMonth + paybackEarningMonths;
    var paysBackWithinHorizon = calendarPaybackMonths !== null && calendarPaybackMonths <= horizonMonths;

    return {
      ok: true,
      directCost: directCost,
      otherCost: otherCost,
      studyHours: studyHours,
      hourValue: hourValue,
      timeCost: timeCost,
      totalInvestment: totalInvestment,
      annualUplift: annualUplift,
      monthlyUplift: monthlyUplift,
      studyMonths: studyMonths,
      delayMonths: delayMonths,
      earningStartMonth: earningStartMonth,
      horizonYears: horizonYears,
      horizonMonths: horizonMonths,
      activeEarningMonths: activeEarningMonths,
      grossUplift: grossUplift,
      netGain: netGain,
      roiPercent: roiPercent,
      paybackEarningMonths: paybackEarningMonths,
      calendarPaybackMonths: calendarPaybackMonths,
      paysBackWithinHorizon: paysBackWithinHorizon
    };
  }

  return { calculate: calculate };
});
