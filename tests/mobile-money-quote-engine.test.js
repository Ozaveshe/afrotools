"use strict";
const assert=require("assert");
const engine=require("../assets/js/engines/mobile-money-quote-engine.js");
const AS_OF="2026-08-08T12:00:00.000Z";
function quote(overrides){return Object.assign({label:"Route A",market:"Synthetic market",currency:"kes",transactionType:"send",amount:5000,senderFee:25,recipientFee:10,observedAt:"2026-08-08T10:00:00.000Z",expiresAt:"2026-08-08T13:00:00.000Z"},overrides||{});}
{
  const result=engine.calculate({asOf:AS_OF,quotes:[quote(),quote({label:"Route B",senderFee:20,recipientFee:5}),quote({label:"Expired",senderFee:0,recipientFee:0,expiresAt:"2026-08-08T11:00:00.000Z"})]});
  assert.strictEqual(result.groups.length,1);assert.strictEqual(result.groups[0].lowestTotalFee,25);assert.strictEqual(result.quotes[0].totalFee,35);assert.ok(Math.abs(result.quotes[0].feePercent-.7)<1e-12);assert.strictEqual(result.quotes[1].lowestAmongEligibleComparable,true);assert.strictEqual(result.quotes[2].comparable,false);
}
assert.strictEqual(engine.calculate({asOf:AS_OF,quotes:[quote(),quote({amount:5001})]}).hasEligibleComparison,false);
assert.strictEqual(engine.calculate({asOf:AS_OF,quotes:[quote(),quote({transactionType:"withdraw"})]}).hasEligibleComparison,false);
assert.throws(()=>engine.calculate({asOf:AS_OF,quotes:[quote(),quote({observedAt:"2026-08-09T10:00:00.000Z"})]}),/OBSERVED_AT_FUTURE/);
assert.throws(()=>engine.calculate({asOf:AS_OF,quotes:[quote(),quote({senderFee:-1})]}),/SENDER_FEE_REQUIRED/);
assert.throws(()=>engine.calculate({asOf:AS_OF,quotes:[quote(),quote({label:"<route>"})]}),/LABEL_REQUIRED/);
const catalog=require("../data/fintech/mobile-money-tariffs.json");
assert.strictEqual(engine.validateCatalog(catalog),true);
{
  const result=engine.quoteTariff(catalog,{providerId:"mtn-uganda",action:"send",amount:500});
  assert.strictEqual(result.available,true);assert.strictEqual(result.fee,100);assert.strictEqual(result.currency,"UGX");assert.strictEqual(result.recipientReceives,500);assert.strictEqual(result.totalDebited,600);assert.strictEqual(result.band.min,500);assert.strictEqual(result.source.publisher,"MTN Uganda");
}
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"mtn-uganda",action:"withdraw",amount:5000000}).fee,20000);
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"mtn-uganda",action:"deposit",amount:2500}).fee,0);
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"mtn-uganda",action:"send",amount:499}).reason,"AMOUNT_OUTSIDE_VERIFIED_BANDS");
{
  const result=engine.quoteTariff(catalog,{providerId:"airtel-tanzania",action:"withdraw",amount:999});
  assert.strictEqual(result.fee,200);assert.deepStrictEqual(result.feeComponents,{transactionFee:190,governmentLevy:10});assert.strictEqual(result.effectiveDate,"2024-04-01");
}
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"airtel-tanzania",action:"withdraw",amount:1000}).fee,320);
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"airtel-tanzania",action:"send",amount:9999}).fee,140);
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"airtel-tanzania",action:"send",amount:10000}).available,false);
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"airtel-tanzania",action:"deposit",amount:1000}).reason,"ACTION_NOT_VERIFIED");
assert.strictEqual(engine.quoteTariff(catalog,{providerId:"unknown",action:"send",amount:1000}).reason,"PROVIDER_NOT_VERIFIED");
{
  const invalid=JSON.parse(JSON.stringify(catalog));invalid.providers[0].actions.send[1].min=2500;
  assert.throws(()=>engine.validateCatalog(invalid),/INVALID_TARIFF_BAND/);
}
{
  const invalid=JSON.parse(JSON.stringify(catalog));invalid.providers[1].actions.withdraw[0].feeComponents.governmentLevy=9;
  assert.throws(()=>engine.validateCatalog(invalid),/INVALID_TARIFF_COMPONENT_TOTAL/);
}
console.log("mobile-money-quote-engine: ok");
