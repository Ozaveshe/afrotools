const assert=require('node:assert/strict');
const engine=require('../engines/src/warehouse-receipt-engine');
const data=require('../data/agriculture/warehouse-receipt-data');
let scenarios=0;
for(const countryCode of Object.keys(data.countries))for(const ltvPct of [0,70,100])for(const priceIncreasePct of [-100,-20,0,20])for(const annualRatePct of [0,12]){
 const input={countryCode,commodity:'maize',quantityTonnes:5,harvestPricePerTonne:100,ltvPct,annualRatePct,periodMonths:4,storagePerTonneMonth:1,insuranceAnnualPct:1,handlingPerTonne:2,priceIncreasePct};
 const r=engine.calculate(input,data);assert.equal(r.ok,true);
 const principal=500*ltvPct/100, costs=principal*annualRatePct/100/3+20+5/3+10,sale=500*(1+priceIncreasePct/100),cash=sale-costs-principal;
 assert.ok(Math.abs(r.cashAfterRepayment-cash)<1e-9);
 assert.equal(r.principalRepayment,principal);
 assert.ok(Math.abs(r.cashAfterRepayment+r.loanAmount-r.netProceeds)<1e-9);
 assert.ok(Math.abs(r.wrsGain-(sale-costs-500))<1e-9);
 assert.equal(r.cashFlowBasis,'all-costs-deducted-at-sale');
 assert.equal(r.excludedCosts.length,3);
 assert.deepEqual(Object.keys(r.country).sort(),['currency','name','symbol']);
 assert.deepEqual(Object.keys(r.commodity),['name']);
 assert.equal(r.assumptionStatus,'illustrative-undated-user-confirmation-required');
 assert.equal(r.country.info,undefined);assert.equal(r.commodity.pattern,undefined);
 if(priceIncreasePct===-100)assert.ok(r.cashAfterRepayment<0);
 const roundTrip=JSON.parse(JSON.stringify(r));assert.equal(roundTrip.cashAfterRepayment,r.cashAfterRepayment);
 scenarios++;
}
console.log(JSON.stringify({scenarios,principalNotDoubleCounted:true,negativeCashPreserved:true,jsonRoundTrips:true}));
