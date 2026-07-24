"use strict";

const assert=require("assert");
const engine=require("../engines/src/remittance-quote-comparator-engine.js");

const AS_OF="2026-07-23T12:00:00.000Z";
function quote(overrides){
  return Object.assign({
    label:"Quote A",
    sendCurrency:"usd",
    totalDebit:500,
    receiveCurrency:"ngn",
    recipientAmount:780000,
    statedFee:5,
    payoutMethod:"bank",
    deliveryMinutes:60,
    observedAt:"2026-07-23T10:00:00.000Z",
    expiresAt:"2026-07-23T13:00:00.000Z",
  },overrides||{});
}

{
  const result=engine.calculate({
    asOf:AS_OF,
    quotes:[
      quote(),
      quote({label:"Quote B",recipientAmount:790000,expiresAt:""}),
      quote({label:"Expired",recipientAmount:900000,expiresAt:"2026-07-23T11:00:00.000Z"}),
    ],
  });
  assert.strictEqual(result.groups.length,1);
  assert.strictEqual(result.groups[0].highestRecipientAmount,790000);
  assert.strictEqual(result.quotes[0].effectiveRate,1560);
  assert.strictEqual(result.quotes[1].expiryState,"unknown");
  assert.strictEqual(result.quotes[1].highestAmongEligibleComparable,true);
  assert.strictEqual(result.quotes[2].expiryState,"expired");
  assert.strictEqual(result.quotes[2].comparable,false);
  assert.strictEqual(result.quotes[2].highestAmongEligibleComparable,false);
}

{
  const result=engine.calculate({
    asOf:AS_OF,
    quotes:[quote(),quote({label:"Different debit",totalDebit:501,recipientAmount:900000})],
  });
  assert.strictEqual(result.hasEligibleComparison,false);
  assert.strictEqual(result.groups.length,0);
  assert.strictEqual(result.excludedCount,2);
}

assert.throws(()=>engine.calculate({
  asOf:AS_OF,
  quotes:[quote(),quote({observedAt:"2026-07-24T10:00:00.000Z"})],
}),/OBSERVED_AT_FUTURE/);

assert.throws(()=>engine.calculate({
  asOf:AS_OF,
  quotes:[quote(),quote({expiresAt:"2026-07-23T09:00:00.000Z"})],
}),/EXPIRY_BEFORE_OBSERVED/);

assert.throws(()=>engine.calculate({
  asOf:AS_OF,
  quotes:[quote(),quote({statedFee:501})],
}),/FEE_EXCEEDS_DEBIT/);

assert.throws(()=>engine.calculate({
  asOf:AS_OF,
  quotes:[quote(),quote({totalDebit:0})],
}),/TOTAL_DEBIT_REQUIRED/);

assert.throws(()=>engine.calculate({
  asOf:AS_OF,
  quotes:[quote(),quote({label:"<script>"})],
}),/LABEL_REQUIRED/);

console.log("remittance-quote-comparator: ok");
