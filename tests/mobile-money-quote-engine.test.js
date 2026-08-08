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
console.log("mobile-money-quote-engine: ok");
