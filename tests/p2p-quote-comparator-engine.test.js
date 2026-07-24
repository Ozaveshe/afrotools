"use strict";
const assert=require("assert");
const engine=require("../engines/src/p2p-quote-comparator-engine.js");
const base={
  side:"buy",assetLabel:"USDT",fiatCode:"NGN",assetAmount:100,
  quotes:[
    {label:"Quote A",checkedAt:"2026-07-23T12:00:00Z",priceFiatPerAsset:1600,percentCost:1,fixedCostFiat:500,reference:"merchant screen"},
    {label:"Quote B",checkedAt:"2026-07-23T12:01:00Z",priceFiatPerAsset:1610,percentCost:0,fixedCostFiat:0,reference:""},
  ]
};
const near=(a,b,t=1e-9)=>assert.ok(Math.abs(a-b)<=t,`${a} != ${b}`);
const buy=engine.calculate(base);
near(buy.quotes[0].grossFiat,160000);
near(buy.quotes[0].variableCostFiat,1600);
near(buy.quotes[0].settlementFiat,162100);
near(buy.quotes[0].effectivePriceFiatPerAsset,1621);
near(buy.observedTargetFiat,161000);
assert.equal(buy.quotes[1].isObservedTarget,true);
near(buy.quotes[0].differenceFromObservedTargetFiat,1100);
const sell=engine.calculate({...base,side:"sell"});
near(sell.quotes[0].settlementFiat,157900);
near(sell.observedTargetFiat,161000);
assert.equal(sell.quotes[1].isObservedTarget,true);
const tied=engine.calculate({...base,quotes:[base.quotes[1],{...base.quotes[1],label:"Quote C"}]});
assert.equal(tied.quotes.filter(row=>row.isObservedTarget).length,2);
const third=engine.calculate({...base,quotes:[...base.quotes,{label:"Quote C",checkedAt:"2026-07-23T12:02:00Z",priceFiatPerAsset:1590,percentCost:0,fixedCostFiat:0}]});
assert.equal(third.quotes.length,3);
assert.equal(third.quotes[2].isObservedTarget,true);
assert.throws(()=>engine.calculate({...base,quotes:[base.quotes[0]]}),/QUOTE_COUNT/);
assert.throws(()=>engine.calculate({...base,assetAmount:0}),/INVALID_NUMBER/);
assert.throws(()=>engine.calculate({...base,quotes:[{...base.quotes[0],checkedAt:"not-a-date"},base.quotes[1]]}),/INVALID_QUOTE_TIME/);
assert.throws(()=>engine.calculate({...base,side:"sell",quotes:[{...base.quotes[0],percentCost:100,fixedCostFiat:1},base.quotes[1]]}),/COSTS_EXCEED_PROCEEDS/);
assert.throws(()=>engine.calculate({...base,quotes:[{...base.quotes[0],label:"<bad>"},base.quotes[1]]}),/QUOTE_LABEL_REQUIRED/);
console.log("p2p-quote-comparator-engine: ok");
