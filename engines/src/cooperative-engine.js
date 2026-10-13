(function cooperativeEngineModule(root, factory) {
  'use strict';
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) {
    root.AfroTools = root.AfroTools || {};
    root.AfroTools.CooperativeEngine = api;
  }
}(typeof window !== 'undefined' ? window : globalThis, function createCooperativeEngine() {
  'use strict';

  function number(value) {
    if (typeof value !== 'number' && typeof value !== 'string') return NaN;
    if (typeof value === 'string' && !value.trim()) return NaN;
    var result = Number(value);
    return Number.isFinite(result) ? result : NaN;
  }

  function calculate(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return { ok: false, status: 'invalid-input' };
    var coopType = input.coopType || 'agri';
    var method = input.method || 'patronage';
    var revenue = number(input.revenue);
    var expenses = number(input.expenses);
    var members = number(input.members);
    var myProduce = number(input.myProduce);
    var totalProduce = number(input.totalProduce);
    var myShares = number(input.myShares);
    var totalShares = number(input.totalShares);
    var marketPrice = number(input.marketPrice);
    var saccoRate = number(input.saccoRate);
    var memberProducePayment = input.memberProducePayment == null || input.memberProducePayment === '' ? null : number(input.memberProducePayment);
    var producePaymentsIncluded = input.producePaymentsIncluded === true;
    var hybridPatronagePct = number(input.hybridPatronagePct);
    var allocations = {
      reserve: number(input.allocations && input.allocations.reserve),
      education: number(input.allocations && input.allocations.education),
      dividend: number(input.allocations && input.allocations.dividend),
      social: number(input.allocations && input.allocations.social),
      retained: number(input.allocations && input.allocations.retained),
    };
    var totalAllocationPct = allocations.reserve + allocations.education + allocations.dividend + allocations.social + allocations.retained;
    var normalizedInput = {
      coopType: coopType,
      method: method,
      revenue: revenue,
      expenses: expenses,
      members: members,
      myProduce: myProduce,
      totalProduce: totalProduce,
      myShares: myShares,
      totalShares: totalShares,
      marketPrice: marketPrice,
      memberProducePayment: memberProducePayment,
      producePaymentsIncluded: producePaymentsIncluded,
      saccoRate: saccoRate,
      hybridPatronagePct: hybridPatronagePct,
      allocations: allocations,
    };
    if (input.currency !== undefined) {
      if (typeof input.currency !== 'string' || !/^[A-Z]{3}$/.test(input.currency)) return { ok: false, status: 'invalid-currency', input: normalizedInput };
      normalizedInput.currency = input.currency;
    }
    if (['agri', 'sacco', 'multi'].indexOf(coopType) < 0 || ['patronage', 'shares', 'hybrid'].indexOf(method) < 0) return { ok: false, status: 'invalid-method', input: normalizedInput };
    var numbers = [revenue, expenses, members, myProduce, totalProduce, myShares, totalShares, marketPrice, saccoRate, hybridPatronagePct];
    if (numbers.some(function (n) { return !Number.isFinite(n) || n < 0; }) || !Number.isSafeInteger(members) || saccoRate > 100 || hybridPatronagePct > 100) return { ok: false, status: 'invalid-input', input: normalizedInput };
    if (Object.keys(allocations).some(function (key) { return !Number.isFinite(allocations[key]) || allocations[key] < 0 || allocations[key] > 100; })) return { ok: false, status: 'invalid-allocation', input: normalizedInput };
    if (memberProducePayment !== null && (!Number.isFinite(memberProducePayment) || memberProducePayment < 0)) return { ok: false, status: 'invalid-member-payment', input: normalizedInput };
    if (producePaymentsIncluded && memberProducePayment !== null && memberProducePayment > expenses) return { ok: false, status: 'payment-exceeds-expenses', input: normalizedInput };
    if (!revenue) return { ok: false, status: 'missing-revenue', input: normalizedInput };
    if (!members) return { ok: false, status: 'missing-members', input: normalizedInput };
    if (Math.abs(totalAllocationPct - 100) > 1e-9) return { ok: false, status: 'allocation-not-100', input: normalizedInput, totalAllocationPct: totalAllocationPct };
    var surplus = revenue - expenses;
    if (surplus < 0) return { ok: false, status: 'negative-surplus', input: normalizedInput, surplus: surplus };
    if (method === 'patronage' && !totalProduce) return { ok: false, status: 'missing-total-produce', input: normalizedInput, surplus: surplus };
    if (method === 'shares' && !totalShares) return { ok: false, status: 'missing-total-shares', input: normalizedInput, surplus: surplus };
    if (method === 'hybrid' && !totalProduce && !totalShares) return { ok: false, status: 'missing-hybrid-totals', input: normalizedInput, surplus: surplus };

    var usesProduce = method === 'patronage' || (method === 'hybrid' && hybridPatronagePct > 0);
    var usesShares = method === 'shares' || (method === 'hybrid' && hybridPatronagePct < 100);
    if (usesProduce && !totalProduce) return { ok: false, status: 'missing-total-produce', input: normalizedInput };
    if (usesShares && !totalShares) return { ok: false, status: 'missing-total-shares', input: normalizedInput };
    if ((usesProduce && myProduce > totalProduce) || (usesShares && myShares > totalShares)) return { ok: false, status: 'member-exceeds-total', input: normalizedInput };

    var amounts = {
      reserve: surplus * (allocations.reserve / 100),
      education: surplus * (allocations.education / 100),
      dividend: surplus * (allocations.dividend / 100),
      social: surplus * (allocations.social / 100),
      retained: surplus * (allocations.retained / 100),
    };
    var hybridPatronage = hybridPatronagePct / 100;
    var hybridShares = 1 - hybridPatronage;
    var patronagePool = amounts.dividend * hybridPatronage;
    var sharePool = amounts.dividend * hybridShares;
    var patronageDividend = 0;
    var shareDividend = 0;
    if (method === 'patronage') patronageDividend = myProduce / totalProduce * amounts.dividend;
    else if (method === 'shares') shareDividend = myShares / totalShares * amounts.dividend;
    else {
      patronageDividend = totalProduce ? myProduce / totalProduce * patronagePool : 0;
      shareDividend = totalShares ? myShares / totalShares * sharePool : 0;
    }
    var memberDividend = patronageDividend + shareDividend;
    var averageDividend = amounts.dividend / members;
    var saccoInterest = coopType === 'sacco' && saccoRate > 0 && myShares ? myShares * (saccoRate / 100) : 0;
    var comparison = null;
    if (coopType !== 'sacco' && marketPrice > 0 && myProduce > 0 && memberProducePayment !== null && producePaymentsIncluded) {
      var independentRevenue = myProduce * marketPrice;
      var cooperativeProduceRevenue = memberProducePayment;
      var cooperativeTotalEarnings = cooperativeProduceRevenue + memberDividend;
      comparison = {
        independentRevenue: independentRevenue,
        cooperativeProduceRevenue: cooperativeProduceRevenue,
        cooperativeTotalEarnings: cooperativeTotalEarnings,
        premiumPct: independentRevenue > 0 ? (cooperativeTotalEarnings - independentRevenue) / independentRevenue * 100 : 0,
        cooperativeAdvantage: cooperativeTotalEarnings >= independentRevenue,
      };
    }
    var outputs = [surplus, surplus / revenue * 100, patronagePool, sharePool, patronageDividend, shareDividend, memberDividend, averageDividend, saccoInterest];
    Object.keys(amounts).forEach(function (key) { outputs.push(amounts[key]); });
    if (comparison) Object.keys(comparison).forEach(function (key) { if (typeof comparison[key] === 'number') outputs.push(comparison[key]); });
    if (outputs.some(function (n) { return !Number.isFinite(n); })) return { ok: false, status: 'numeric-overflow', input: normalizedInput };
    return {
      ok: true,
      status: 'calculated',
      input: normalizedInput,
      totalAllocationPct: totalAllocationPct,
      surplus: surplus,
      surplusMarginPct: surplus / revenue * 100,
      amounts: amounts,
      hybrid: { patronagePct: hybridPatronagePct, sharesPct: 100 - hybridPatronagePct, patronagePool: patronagePool, sharePool: sharePool },
      patronageDividend: patronageDividend,
      shareDividend: shareDividend,
      memberDividend: memberDividend,
      averageDividend: averageDividend,
      dividendDifference: memberDividend - averageDividend,
      saccoInterest: saccoInterest,
      declaredShareDividend: saccoInterest,
      totalSaccoEarnings: null,
      saccoEstimateBasis: 'alternative-estimates-do-not-add',
      comparisonStatus: coopType === 'sacco' ? 'not-applicable' : comparison ? 'member-payment-scenario' : 'member-payment-and-expense-confirmation-required',
      comparison: comparison,
    };
  }

  return { calculate: calculate };
}));
