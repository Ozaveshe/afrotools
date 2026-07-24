(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.engines = root.AfroTools.engines || {};
    root.AfroTools.engines.staffCostPlanner = api;
  }
})(typeof window !== 'undefined' ? window : this, function () {
  'use strict';

  function amount(value, label) {
    var number = Number(value == null || value === '' ? 0 : value);
    if (!Number.isFinite(number) || number < 0) throw new Error(label + ' must be zero or more.');
    return number;
  }
  function isoDate(value, label) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value || '') || Number.isNaN(Date.parse(value + 'T00:00:00Z'))) throw new Error(label + ' must be a valid date.');
    return value;
  }
  function daysBetween(from, to) { return Math.floor((Date.parse(to + 'T00:00:00Z') - Date.parse(from + 'T00:00:00Z')) / 86400000); }

  function calculate(input) {
    input = input || {};
    var currency = String(input.currency || '').trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Enter a three-letter currency code such as NGN, KES, ZAR or GHS.');
    var headcount = Number(input.headcount);
    if (!Number.isInteger(headcount) || headcount < 1 || headcount > 100000) throw new Error('Headcount must be a whole number from 1 to 100,000.');
    var horizonMonths = Number(input.horizonMonths);
    if (!Number.isInteger(horizonMonths) || horizonMonths < 1 || horizonMonths > 60) throw new Error('Planning horizon must be a whole number from 1 to 60 months.');
    if (input.employeeStatusConfirmed !== true) throw new Error('Confirm that the worker relationship has been reviewed as employment before calculating.');
    if (input.obligationEvidenceConfirmed !== true) throw new Error('Confirm that the employer-obligation amount comes from current authority, payroll or professional evidence.');
    var sourceLabel = String(input.sourceLabel || '').trim();
    if (sourceLabel.length < 5) throw new Error('Name the authority, payroll schedule or professional source used for employer obligations.');
    var sourceCheckedDate = isoDate(input.sourceCheckedDate, 'Source checked date');
    var asOfDate = isoDate(input.asOfDate, 'Calculation date');
    var ageDays = daysBetween(sourceCheckedDate, asOfDate);
    if (ageDays < 0) throw new Error('Source checked date cannot be after the calculation date.');
    if (ageDays > 366) throw new Error('The employer-obligation source is over one year old. Recheck it before calculating.');

    var salary = amount(input.monthlySalary, 'Monthly cash salary');
    if (salary <= 0) throw new Error('Monthly cash salary must be greater than zero.');
    var obligations = amount(input.monthlyEmployerObligations, 'Monthly employer obligations');
    var benefits = amount(input.monthlyBenefits, 'Monthly benefits and insurance');
    var recurring = amount(input.monthlyOtherRecurring, 'Other monthly staff cost');
    var recruitment = amount(input.recruitmentCost, 'Recruitment cost');
    var equipment = amount(input.equipmentCost, 'Equipment and setup cost');
    var annualExtras = amount(input.annualExtras, 'Annual bonus and other annual benefits');
    var contingencyPercent = amount(input.contingencyPercent, 'Planning contingency');
    if (contingencyPercent > 100) throw new Error('Planning contingency must not exceed 100%.');

    var recurringPerPerson = salary + obligations + benefits + recurring;
    var teamRecurringMonthly = recurringPerPerson * headcount;
    var oneOffTeam = (recruitment + equipment) * headcount;
    var annualExtrasForHorizon = annualExtras * headcount * horizonMonths / 12;
    var subtotal = teamRecurringMonthly * horizonMonths + oneOffTeam + annualExtrasForHorizon;
    var contingency = subtotal * contingencyPercent / 100;
    var horizonTotal = subtotal + contingency;
    var salaryForHorizon = salary * headcount * horizonMonths;
    var loadAboveSalary = horizonTotal - salaryForHorizon;

    return {
      currency: currency, headcount: headcount, horizonMonths: horizonMonths, sourceLabel: sourceLabel, sourceCheckedDate: sourceCheckedDate, sourceAgeDays: ageDays,
      perPerson: { salary: salary, employerObligations: obligations, benefits: benefits, otherRecurring: recurring, recruitment: recruitment, equipment: equipment, annualExtras: annualExtras, recurringMonthly: recurringPerPerson },
      teamRecurringMonthly: teamRecurringMonthly, oneOffTeam: oneOffTeam, annualExtrasForHorizon: annualExtrasForHorizon,
      subtotal: subtotal, contingencyPercent: contingencyPercent, contingency: contingency, horizonTotal: horizonTotal,
      monthlyPlanningAverage: horizonTotal / horizonMonths, costPerPersonForHorizon: horizonTotal / headcount,
      salaryForHorizon: salaryForHorizon, loadAboveSalary: loadAboveSalary, loadPercent: salaryForHorizon ? loadAboveSalary / salaryForHorizon * 100 : 0
    };
  }

  return {
    calculate: calculate,
    formulaParameters: { mode: 'user-evidenced-staff-budget', maximumSourceAgeDays: 366, maximumHorizonMonths: 60, maximumHeadcount: 100000, bundledStatutoryRates: false, employeeDeductionsCalculated: false, terminationCalculated: false },
    roundingPolicy: { method: 'unrounded-decimal', precision: 'Full JavaScript number precision; presentation and exports round to two currency decimals.', stages: ['No intermediate rounding is applied.'] }
  };
});
