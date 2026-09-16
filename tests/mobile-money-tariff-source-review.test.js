'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const engine=require('../assets/js/engines/mobile-money-quote-engine');
const catalog=require('../data/fintech/mobile-money-tariffs.json');
// Independently transcribed official source columns, 16 September 2026.
// Airtel PDF footer: January–March 2026; this fixture does not certify current rates.
const bounds={mtn:[500,2501,5001,15001,30001,45001,60001,125001,250001,500001,1000001,2000001,4000001,5000001],airtel:[100,1000,2000,3000,4000,5000,7000,10000,15000,20000,30000,40000,50000,100000,200000,300000,400000,500000,600000,700000,800000,900000,1000001,3000001,5000001]};
const rows=[
 ['mtn-uganda','send','mtn',[100,100,500,500,500,500,1000,1000,1000,1500,2000,2000,2000]],
 ['mtn-uganda','withdraw','mtn',[330,440,700,880,1210,1500,1925,3575,7000,12500,15000,18000,20000]],
 ['airtel-tanzania','send','airtel',[10,25,25,40,50,120,140,325,350,360,375,380,675,940,1200,1450,1450,2100,3100,3100,3250,3300,4000,4000]],
 ['airtel-tanzania','withdraw','airtel',[190,310,390,590,640,950,1000,1552,1645,2156,2201,2719,3173,4207,5921,7038,7682,8445,9132,9300,9350,9376,9475,11500]]
];
const airtelLevies=[10,10,10,14,27,54,56,102,195,306,351,419,573,707,821,838,982,1245,1532,1700,1750,1776,1875,2000];
for(const [providerId,action,key,fees] of rows)test(providerId+' '+action+' every published boundary and adjacent band',()=>{
 const limits=bounds[key];assert.equal(catalog.providers.find(p=>p.id===providerId).actions[action].length,fees.length);
 for(let i=0;i<fees.length;i++)for(const amount of [limits[i],limits[i+1]-1]){
  const q=engine.quoteTariff(catalog,{providerId,action,amount});assert.equal(q.available,true);assert.equal(q.fee,fees[i]);assert.equal(q.currency,key==='mtn'?'UGX':'TZS');assert.equal(q.amountPlusPublishedFee,amount+fees[i]);
  if(key==='mtn'&&action==='withdraw'){assert.equal(q.totalDebited,null);assert.equal(q.totalIncludesAllCharges,false);}else assert.equal(q.totalDebited,amount+fees[i]);
  if(q.feeComponents){assert.equal(q.feeComponents.governmentLevy,airtelLevies[i]);assert.equal(q.feeComponents.transactionFee,fees[i]-airtelLevies[i]);assert.equal(q.feeComponents.transactionFee+q.feeComponents.governmentLevy,fees[i]);}
 }
 for(const amount of [limits[0]-1,limits.at(-1)])assert.equal(engine.quoteTariff(catalog,{providerId,action,amount}).available,false);
});
test('cash-in qualification, unavailable actions and dated evidence remain explicit',()=>{
 for(const amount of [500,5000000])assert.equal(engine.quoteTariff(catalog,{providerId:'mtn-uganda',action:'deposit',amount}).fee,0);
 for(const providerId of ['mtn-uganda','airtel-tanzania'])assert.equal(engine.quoteTariff(catalog,{providerId,action:'bank',amount:1000}).available,false);
 const q=engine.quoteTariff(catalog,{providerId:'airtel-tanzania',action:'withdraw',amount:1000});
 assert.equal(q.sourcePeriod,'January–March 2026');assert.equal(q.effectiveDate,null);assert.equal(q.confidence,'official-dated-reference');assert.match(q.caveats.join(' '),/Current validity is unconfirmed/);
 assert.match(catalog.providers[0].caveats.join(' '),/Account-tier/);
});
