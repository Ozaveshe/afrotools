'use strict';
const assert=require('node:assert/strict'),engine=require('../engines/src/warehouse-receipt-engine'),data=require('../data/agriculture/warehouse-receipt-data');
const base={countryCode:'NG',commodity:'maize',quantityTonnes:5,harvestPricePerTonne:100,ltvPct:70,annualRatePct:12,periodMonths:4,storagePerTonneMonth:1,insuranceAnnualPct:1,handlingPerTonne:2,priceIncreasePct:20};
let invalid=0,scenarios=0;
function reject(input,status){const r=engine.calculate(input,data);assert.equal(r.ok,false);if(status)assert.equal(r.status,status);invalid++;}
for(const input of [null,undefined,[],false,''])reject(input,'invalid-input');
for(const field of ['quantityTonnes','harvestPricePerTonne','ltvPct','annualRatePct','periodMonths','storagePerTonneMonth','insuranceAnnualPct','handlingPerTonne','priceIncreasePct']){
  for(const value of [undefined,null,'',NaN,Infinity,-Infinity,'5oops',true,{}])reject({...base,[field]:value});
}
for(const field of ['quantityTonnes','harvestPricePerTonne','ltvPct','annualRatePct','periodMonths','storagePerTonneMonth','insuranceAnnualPct','handlingPerTonne'])reject({...base,[field]:-1});
for(const countryCode of ['toString','constructor','__proto__','ZZ'])reject({...base,countryCode},'missing-country');
for(const commodity of ['toString','constructor','__proto__','unknown'])reject({...base,commodity},'missing-commodity');
reject({...base,ltvPct:101},'invalid-ltv');reject({...base,periodMonths:0},'invalid-period');reject({...base,priceIncreasePct:-101},'invalid-price-change');
reject({...base,quantityTonnes:Number.MAX_VALUE},'numeric-overflow');
for(const quantityTonnes of [0.5,5,125.75])for(const periodMonths of [0.5,4,12,24])for(const ltvPct of [0,70,100]){
  const v={...base,quantityTonnes,periodMonths,ltvPct};const r=engine.calculate(v,data);assert.equal(r.ok,true);
  const grain=quantityTonnes*100,expectedCost=grain*(ltvPct/100)*0.12*(periodMonths/12)+quantityTonnes*periodMonths+grain*0.01*(periodMonths/12)+quantityTonnes*2;
  assert.ok(Math.abs(r.totalCost-expectedCost)<1e-8);
  const threshold=engine.calculate({...v,priceIncreasePct:r.breakEvenIncreasePct},data);assert.ok(Math.abs(threshold.wrsGain)<1e-8);
  const down=engine.calculate({...v,priceIncreasePct:-100},data);assert.equal(down.saleRevenue,0);assert.equal(down.netProceeds,-r.totalCost);
  const zero=engine.calculate({...v,annualRatePct:0,storagePerTonneMonth:0,insuranceAnnualPct:0,handlingPerTonne:0,priceIncreasePct:0},data);assert.equal(zero.totalCost,0);assert.equal(zero.wrsGain,0);assert.equal(zero.breakEvenIncreasePct,0);
  assert.deepEqual(engine.calculate(r.input,data),r);scenarios++;
}
console.log(JSON.stringify({invalidCasesRejected:invalid,independentCostAndBreakEvenScenarios:scenarios,zeroCostsAndFullPriceLossPreserved:true,roundTrips:true}));
