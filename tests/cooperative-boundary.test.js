'use strict';
const assert = require('node:assert/strict');
const engine = require('../engines/src/cooperative-engine');
const base = {coopType:'agri',method:'patronage',revenue:10000000,expenses:6500000,members:120,myProduce:1200,totalProduce:85000,myShares:50000,totalShares:3500000,marketPrice:450,saccoRate:0,hybridPatronagePct:50,allocations:{reserve:25,education:5,dividend:50,social:5,retained:15}};
let rejected=0, distributions=0;
function reject(input,status) { const r=engine.calculate(input);assert.equal(r.ok,false);if(status)assert.equal(r.status,status);rejected++; }
for (const input of [null,undefined,[],true,'']) reject(input);
for (const key of ['revenue','expenses','members','myProduce','totalProduce','myShares','totalShares','marketPrice','saccoRate','hybridPatronagePct']) {
  for(const value of [-1,NaN,Infinity,'bad','',null,{},true]) reject({...base,[key]:value});
}
for(const key of Object.keys(base.allocations)) for(const value of [-1,101,NaN,'',null]) reject({...base,allocations:{...base.allocations,[key]:value}});
reject({...base,members:1.5});
reject({...base,members:Number.MAX_SAFE_INTEGER+1});
reject({...base,coopType:'marketing'});
reject({...base,method:'unknown'});
reject({...base,hybridPatronagePct:101});
reject({...base,saccoRate:101});
for(const dividend of [49.6,50.4]) reject({...base,allocations:{...base.allocations,dividend}},'allocation-not-100');
reject({...base,myProduce:85001},'member-exceeds-total');
reject({...base,method:'shares',myShares:3500001},'member-exceeds-total');
reject({...base,method:'hybrid',totalShares:0,myShares:0},'missing-total-shares');
reject({...base,method:'hybrid',totalProduce:0,myProduce:0},'missing-total-produce');
reject({...base,revenue:Number.MAX_VALUE,marketPrice:Number.MAX_VALUE,memberProducePayment:100,producePaymentsIncluded:true},'numeric-overflow');
for(const pct of [0,100]) {
  const r=engine.calculate({...base,method:'hybrid',hybridPatronagePct:pct,...(pct===0?{myProduce:0,totalProduce:0}:{myShares:0,totalShares:0})});
  assert.equal(r.ok,true,'A zero-weight pool needs no denominator');
}
function near(actual,expected) {assert.ok(Math.abs(actual-expected)<=1e-9*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);}
// Independent conservation oracle: sum all five members' payouts and compare
// to the declared dividend pool, including unequal shares and production.
const produce=[1,2,3,4,5], shares=[5,4,3,2,1];
for(const method of ['patronage','shares','hybrid']) for(const pct of [0,10,33.3,50,90,100]) for(const revenue of [1,1000,10000000]) for(const expenseRatio of [0,0.35,1]) {
  let paid=0;
  for(let i=0;i<5;i++) {
    const r=engine.calculate({...base,method,hybridPatronagePct:pct,revenue,expenses:revenue*expenseRatio,members:5,myProduce:produce[i],totalProduce:15,myShares:shares[i],totalShares:15,marketPrice:0});
    assert.equal(r.ok,true);near(Object.values(r.amounts).reduce((a,b)=>a+b,0),revenue*(1-expenseRatio));
    assert.ok(r.memberDividend>=0&&r.memberDividend<=r.amounts.dividend);paid+=r.memberDividend;
  }
  near(paid,revenue*(1-expenseRatio)*0.5);distributions++;
}
console.log(JSON.stringify({rejected,balancedWholeMembershipScenarios:distributions,memberCalculations:distributions*5,status:'PASS'}));
