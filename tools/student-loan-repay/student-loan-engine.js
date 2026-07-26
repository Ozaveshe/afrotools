(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.StudentLoanEngine = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function finiteNumber(value, label) {
    var number = Number(value);
    if (!Number.isFinite(number)) throw new Error(label + ' must be a number.');
    return number;
  }

  function calculate(input) {
    input = input || {};
    var principal = finiteNumber(input.principal, 'Loan amount');
    var annualRate = finiteNumber(input.annualRate, 'Annual interest rate');
    var months = Math.round(finiteNumber(input.months, 'Repayment term'));
    var extraPayment = input.extraPayment === '' || input.extraPayment == null
      ? 0
      : finiteNumber(input.extraPayment, 'Extra monthly payment');

    if (principal <= 0) throw new Error('Loan amount must be greater than zero.');
    if (annualRate < 0 || annualRate > 100) throw new Error('Annual interest rate must be between 0% and 100%.');
    if (months < 1 || months > 600) throw new Error('Repayment term must be between 1 and 600 months.');
    if (extraPayment < 0) throw new Error('Extra monthly payment cannot be negative.');

    var monthlyRate = annualRate / 1200;
    var scheduledPayment = monthlyRate === 0
      ? principal / months
      : principal * monthlyRate * Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1);
    var targetPayment = scheduledPayment + extraPayment;
    var balance = principal;
    var schedule = [];
    var totalPaid = 0;
    var totalInterest = 0;

    for (var month = 1; balance > 0.0000001 && month <= 1200; month += 1) {
      var openingBalance = balance;
      var interest = openingBalance * monthlyRate;
      var payment = Math.min(targetPayment, openingBalance + interest);
      var principalPaid = payment - interest;
      balance = Math.max(0, openingBalance - principalPaid);
      if (balance < 0.0000001) balance = 0;
      totalPaid += payment;
      totalInterest += interest;
      schedule.push({
        month: month,
        openingBalance: openingBalance,
        payment: payment,
        interest: interest,
        principal: principalPaid,
        balance: balance
      });
    }

    if (balance > 0.0000001) throw new Error('The repayment plan could not be completed.');

    return {
      principal: principal,
      annualRate: annualRate,
      contractualMonths: months,
      extraPayment: extraPayment,
      scheduledPayment: scheduledPayment,
      monthlyPayment: targetPayment,
      payoffMonths: schedule.length,
      totalPaid: totalPaid,
      totalInterest: totalInterest,
      schedule: schedule
    };
  }

  function compare(input) {
    var withExtra = calculate(input);
    var baseline = calculate({
      principal: input.principal,
      annualRate: input.annualRate,
      months: input.months,
      extraPayment: 0
    });
    return {
      plan: withExtra,
      baseline: baseline,
      monthsSaved: Math.max(0, baseline.payoffMonths - withExtra.payoffMonths),
      interestSaved: Math.max(0, baseline.totalInterest - withExtra.totalInterest)
    };
  }

  return { calculate: calculate, compare: compare };
}));
