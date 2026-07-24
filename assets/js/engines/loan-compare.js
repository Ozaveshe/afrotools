(function (root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.loanCompare = api;
  }
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';

  function number(value, label) {
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
  function calculateOffer(raw) {
    var input = raw || {};
    if (input.confirmedAssumptions !== true) throw new Error('Confirm that every figure comes from an offer or your own scenario.');
    var amount = number(input.amount, 'Loan amount');
    var annualRate = number(input.annualRate, 'Annual rate');
    var months = Math.round(number(input.termMonths, 'Term'));
    var paidUpfront = number(input.paidUpfront || 0, 'Fees paid upfront');
    var deducted = number(input.deductedFees || 0, 'Fees deducted');
    var monthlyFees = number(input.monthlyFees || 0, 'Monthly fees');
    var finalPayment = number(input.finalPayment || 0, 'Final payment');
    var method = input.rateMethod === 'flat' ? 'flat' : 'reducing';
    if (amount <= 0) throw new Error('Loan amount must be greater than zero.');
    if (months < 1 || months > 600) throw new Error('Term must be between 1 and 600 months.');
    if (annualRate > 500) throw new Error('Review the annual rate.');
    if (deducted >= amount) throw new Error('Deducted fees must be less than the loan amount.');
    var basePayment;
    var totalInterest;
    if (method === 'flat') {
      totalInterest = amount * annualRate / 100 * (months / 12);
      basePayment = (amount + totalInterest) / months;
    } else {
      basePayment = payment(amount, annualRate, months);
      totalInterest = basePayment * months - amount;
    }
    var cashReceived = amount - deducted;
    var monthlyDue = basePayment + monthlyFees;
    var totalFees = paidUpfront + deducted + monthlyFees * months + finalPayment;
    var totalCashOut = basePayment * months + monthlyFees * months + paidUpfront + finalPayment;
    var borrowingCost = totalCashOut - cashReceived;
    return {
      name: String(input.name || '').trim() || 'Offer', amount: round(amount), annualRate: round(annualRate),
      termMonths: months, rateMethod: method, paidUpfront: round(paidUpfront), deductedFees: round(deducted),
      monthlyFees: round(monthlyFees), finalPayment: round(finalPayment), cashReceived: round(cashReceived),
      basePayment: round(basePayment), monthlyDue: round(monthlyDue), totalInterest: round(totalInterest),
      totalFees: round(totalFees), totalCashOut: round(totalCashOut), borrowingCost: round(borrowingCost),
      costPer100Received: round(borrowingCost / cashReceived * 100)
    };
  }
  function compareOffers(rawOffers) {
    if (!Array.isArray(rawOffers) || rawOffers.length < 2 || rawOffers.length > 4) throw new Error('Compare between 2 and 4 offers.');
    var offers = rawOffers.map(calculateOffer);
    var sameAmount = offers.every(function (offer) { return Math.abs(offer.amount - offers[0].amount) < 0.01; });
    var sameTerm = offers.every(function (offer) { return offer.termMonths === offers[0].termMonths; });
    var winnerIndex = null;
    var savings = null;
    if (sameAmount && sameTerm) {
      var ordered = offers.map(function (offer, index) { return { index: index, cost: offer.totalCashOut }; }).sort(function (a, b) { return a.cost - b.cost; });
      if (Math.abs(ordered[0].cost - ordered[1].cost) >= 0.01) {
        winnerIndex = ordered[0].index;
        savings = round(ordered[1].cost - ordered[0].cost);
      }
    }
    return {
      offers: offers, sameAmount: sameAmount, sameTerm: sameTerm,
      directlyComparable: sameAmount && sameTerm, winnerIndex: winnerIndex, savings: savings
    };
  }
  return {
    payment: payment, calculateOffer: calculateOffer, compareOffers: compareOffers,
    metadata: {
      reviewedAt: '2026-07-22',
      comparisonUrl: 'https://www.consumerfinance.gov/owning-a-home/compare/compare-loan-estimates/',
      aprUrl: 'https://www.consumerfinance.gov/ask-cfpb/what-is-the-difference-between-a-loan-interest-rate-and-the-apr-en-733/'
    }
  };
});
