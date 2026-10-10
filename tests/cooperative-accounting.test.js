'use strict';
const assert=require('node:assert/strict'),engine=require('../engines/src/cooperative-engine');
const base={coopType:'agri',method:'patronage',revenue:1000,expenses:500,members:5,myProduce:3,totalProduce:15,myShares:3,totalShares:15,marketPrice:100,saccoRate:10,hybridPatronagePct:50,allocations:{reserve:25,education:5,dividend:50,social:5,retained:15}};
assert.equal(engine.calculate(base).comparison,null);
assert.equal(engine.calculate({...base,memberProducePayment:200}).comparison,null);
assert.equal(engine.calculate({...base,producePaymentsIncluded:true}).comparison,null);
for(const payment of [0,100,200,500]){
  const r=engine.calculate({...base,memberProducePayment:payment,producePaymentsIncluded:true});
  assert.equal(r.ok,true);assert.equal(r.memberDividend,50);
  assert.equal(r.comparison.independentRevenue,300);
  assert.equal(r.comparison.cooperativeProduceRevenue,payment);
  assert.equal(r.comparison.cooperativeTotalEarnings,payment+50);
  // Equal surplus with different turnover must not alter member receipts.
  const other=engine.calculate({...base,revenue:1500,expenses:1000,memberProducePayment:payment,producePaymentsIncluded:true});
  assert.deepEqual(other.comparison,r.comparison);
}
for(const payment of [-1,Infinity,NaN,'bad',{},true])assert.equal(engine.calculate({...base,memberProducePayment:payment}).status,'invalid-member-payment');
assert.equal(engine.calculate({...base,memberProducePayment:501,producePaymentsIncluded:true}).status,'payment-exceeds-expenses');
const sacco=engine.calculate({...base,coopType:'sacco',method:'shares'});
assert.equal(sacco.memberDividend,50);assert.ok(Math.abs(sacco.declaredShareDividend-0.3)<1e-12);
assert.equal(sacco.totalSaccoEarnings,null);assert.equal(sacco.comparison,null);
assert.equal(sacco.saccoEstimateBasis,'alternative-estimates-do-not-add');
console.log('PASS member receipts use explicit payments, zero preserved, turnover invariance, expense inclusion and non-additive SACCO estimates');
