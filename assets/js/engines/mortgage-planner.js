(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.mortgagePlanner = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function amount(value, label) {
    var parsed = Number(value);
    if (!Number.isFinite(parsed) || parsed < 0) throw new Error(label + ' must be zero or greater.');
    return parsed;
  }
  function round(value) { return Math.round((value + Number.EPSILON) * 100) / 100; }
  function payment(principal, annualRate, months) {
    if (!months) return 0;
    var rate = annualRate / 100 / 12;
    if (!rate) return principal / months;
    var growth = Math.pow(1 + rate, months);
    return principal * rate * growth / (growth - 1);
  }
  function calculate(raw) {
    var input = raw || {};
    if (input.confirmedAssumptions !== true) throw new Error('Confirm that the rate and costs are your planning assumptions.');
    var price = amount(input.propertyPrice, 'Property price');
    var deposit = amount(input.deposit, 'Deposit');
    var annualRate = amount(input.annualRate, 'Annual interest rate');
    var years = amount(input.termYears, 'Loan term');
    var upfrontCosts = amount(input.upfrontCosts || 0, 'Upfront costs');
    var monthlyCosts = amount(input.monthlyCosts || 0, 'Monthly costs');
    var stressIncrease = amount(input.stressIncrease || 0, 'Stress-rate increase');
    if (price <= 0) throw new Error('Property price must be greater than zero.');
    if (deposit > price) throw new Error('Deposit cannot exceed property price.');
    if (years <= 0 || years > 50) throw new Error('Loan term must be between zero and 50 years.');
    if (annualRate > 100 || stressIncrease > 100) throw new Error('Review the interest-rate assumptions.');
    var months = Math.round(years * 12);
    if (!months) throw new Error('Loan term must include at least one month.');
    var principal = price - deposit;
    var monthlyPi = payment(principal, annualRate, months);
    var corePaid = monthlyPi * months;
    var totalInterest = corePaid - principal;
    var stressMonthlyPi = payment(principal, annualRate + stressIncrease, months);
    var balance = principal;
    var monthlyRate = annualRate / 100 / 12;
    var schedule = [];
    var paidPrincipal = 0;
    var paidInterest = 0;
    var fiveYearPrincipal = 0;
    var fiveYearInterest = 0;
    var fiveYearMonths = Math.min(60, months);
    for (var month = 1; month <= months; month += 1) {
      var interestPart = monthlyRate ? balance * monthlyRate : 0;
      var principalPart = month === months ? balance : Math.min(balance, monthlyPi - interestPart);
      balance = Math.max(0, balance - principalPart);
      paidPrincipal += principalPart;
      paidInterest += interestPart;
      if (month <= fiveYearMonths) {
        fiveYearPrincipal += principalPart;
        fiveYearInterest += interestPart;
      }
      if (month % 12 === 0 || month === months) {
        schedule.push({
          year: Math.ceil(month / 12), months: month % 12 || 12,
          principalPaid: round(paidPrincipal), interestPaid: round(paidInterest), balance: round(balance)
        });
        paidPrincipal = 0;
        paidInterest = 0;
      }
    }
    return {
      propertyPrice: round(price), deposit: round(deposit), principal: round(principal),
      annualRate: annualRate, termYears: years, months: months,
      monthlyPrincipalInterest: round(monthlyPi), monthlyCosts: round(monthlyCosts),
      allInMonthly: round(monthlyPi + monthlyCosts), totalInterest: round(totalInterest),
      totalCorePayments: round(corePaid), totalAllInPayments: round(corePaid + monthlyCosts * months),
      upfrontCash: round(deposit + upfrontCosts), upfrontCosts: round(upfrontCosts),
      ltv: price ? round(principal / price * 100) : 0,
      tip: principal ? round(totalInterest / principal * 100) : 0,
      comparisonMonths: fiveYearMonths,
      comparisonPrincipal: round(fiveYearPrincipal), comparisonInterest: round(fiveYearInterest),
      comparisonPayments: round(fiveYearPrincipal + fiveYearInterest + monthlyCosts * fiveYearMonths),
      stressRate: round(annualRate + stressIncrease), stressMonthly: round(stressMonthlyPi + monthlyCosts),
      stressDelta: round(stressMonthlyPi - monthlyPi), schedule: schedule
    };
  }
  return {
    calculate: calculate,
    payment: payment,
    metadata: {
      reviewedAt: '2026-07-22',
      methodologyUrl: 'https://www.consumerfinance.gov/owning-a-home/loan-estimate/',
      africaContextUrl: 'https://www.worldbank.org/content/dam/Worldbank/document/Africa/Report/stocktaking-of-the-housing-sector-in-sub-saharan-africa-full-report.pdf'
    }
  };
});
