"use strict";
const assert=require("assert");
const engine=require("../engines/src/microfinance-offer-engine.js");
const base={currencyUnit:"TEST",principal:1000,quotedRatePct:12,rateBasis:"annual",method:"reducing",periodsPerYear:12,paymentCount:12,withheldFees:0,financedFees:0,recurringCharge:0,financedFeesBearInterest:true};
const near=(actual,expected,tolerance=1e-6)=>assert.ok(Math.abs(actual-expected)<=tolerance,`${actual} != ${expected}`);

assert.strictEqual(engine.normalizeRate(12,"annual",12),.12);
assert.strictEqual(engine.normalizeRate(1,"monthly",52),.12);
assert.strictEqual(engine.normalizeRate(1,"period",52),.52);

const zero=engine.calculate({...base,quotedRatePct:0,paymentCount:1});
near(zero.paymentPerPeriod,1000);
near(zero.totalBorrowingCost,0);
assert.strictEqual(zero.effectiveAnnualCostRatePct,0);

const flat=engine.calculate({...base,method:"flat"});
near(flat.paymentPerPeriod,93.33333333333333);
near(flat.totalRepayment,1120);
near(flat.rows[0].interest,10);
near(flat.rows[11].closing,0,1e-9);

const reducing=engine.calculate(base);
near(reducing.paymentPerPeriod,88.84878867834168);
near(reducing.rows[0].interest,10);
assert.ok(reducing.totalRepayment<flat.totalRepayment);
near(reducing.rows[11].closing,0,1e-8);

const financedInterest=engine.calculate({...base,financedFees:120,financedFeesBearInterest:true});
const financedNoInterest=engine.calculate({...base,financedFees:120,financedFeesBearInterest:false});
assert.ok(financedInterest.totalRepayment>financedNoInterest.totalRepayment);
near(financedNoInterest.paymentPerPeriod,reducing.paymentPerPeriod+10);

const weekly=engine.calculate({...base,quotedRatePct:1,rateBasis:"period",periodsPerYear:52,paymentCount:52});
const monthly=engine.calculate({...base,quotedRatePct:12,rateBasis:"annual",periodsPerYear:12,paymentCount:12});
near(weekly.normalizedNominalAnnualRatePct,52);
near(monthly.normalizedNominalAnnualRatePct,12);

const charges=engine.calculate({...base,withheldFees:100,recurringCharge:5});
near(charges.paymentPerPeriod,reducing.paymentPerPeriod+5);
assert.ok(charges.effectiveAnnualCostRatePct>reducing.effectiveAnnualCostRatePct);

assert.throws(()=>engine.calculate({...base,withheldFees:1000}),/NET_PROCEEDS_REQUIRED/);
assert.throws(()=>engine.calculate({...base,paymentCount:1.5}),/INVALID_COUNT/);
assert.throws(()=>engine.calculate({...base,paymentCount:521}),/INVALID_NUMBER/);
assert.throws(()=>engine.calculate({...base,principal:1e308}),/INVALID_NUMBER/);
assert.throws(()=>engine.calculate({...base,quotedRatePct:1001}),/INVALID_NUMBER/);
assert.throws(()=>engine.calculate({...base,financedFees:1e308}),/INVALID_NUMBER/);
assert.strictEqual(engine.effectiveAnnualCostRate(1000,[900],12),0);
assert.strictEqual(engine.effectiveAnnualCostRate(1,[1e18],52),null);
console.log("microfinance-offer-engine: ok");
