'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../assets/js/engines/mobile-money-quote-engine');
const catalog=require('../data/fintech/mobile-money-tariffs.json');
// Operator table independently read on 2026-11-13: airtelmoney.ke/tariffs_charges.
// A published dash is unavailable. The page gives a KES250000 transaction limit.
const lower=[10,50,101,501,1001,1501,2501,3501,5001,7501,10001,15001,20001,25001,30001,35001,40001,45001,50001,70001,150001,250001];
const other=[null,null,7,13,23,33,53,57,78,90,100,105,108,108,108,108,108,108,108,108,108];
const cash=[null,11,29,29,29,29,52,69,87,115,167,185,197,197,197,278,278,278,309,309,309];
for(const [action,fees] of [['send-same-network',Array(21).fill(0)],['send-other-network',other],['withdraw',cash]])test(action+' retains every published boundary and uncovered band',()=>{
 for(let i=0;i<fees.length;i++)for(const amount of [lower[i],lower[i+1]-1]){
  const q=engine.quoteTariff(catalog,{providerId:'airtel-kenya',action,amount});assert.equal(q.available,fees[i]!==null);
  if(fees[i]!==null){assert.equal(q.fee,fees[i]);assert.equal(q.totalDebited,amount+fees[i]);assert.equal(q.currency,'KES');assert.equal(q.effectiveDate,null);assert.equal(q.source.url,'https://www.airtelmoney.ke/tariffs_charges');}
 }
 for(const amount of [9,250001])assert.equal(engine.quoteTariff(catalog,{providerId:'airtel-kenya',action,amount}).available,false);
});
test('ambiguous send and unsupported deposit never imply a free fee',()=>{
 for(const action of ['send','deposit'])assert.equal(engine.quoteTariff(catalog,{providerId:'airtel-kenya',action,amount:2000}).available,false);
});
