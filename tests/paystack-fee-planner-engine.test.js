const test=require("node:test");
const assert=require("node:assert/strict");
const engine=require("../assets/js/engines/paystack-fee-planner.js");
const fresh=new Date("2026-07-23T12:00:00Z");

function calculate(country,channel,amount,count=1,targetNet=0){
  const result=engine.calculate({country,channel,amount,count,targetNet},fresh);
  assert.equal(result.ok,true);
  return result;
}

test("Nigeria local waives only the fixed NGN 100 strictly below NGN 2,500",()=>{
  const below=calculate("NG","local",2000);
  assert.equal(below.breakdown.fixedWaived,true);
  assert.equal(below.breakdown.percentageFee,30);
  assert.equal(below.perTransaction.fee,30);
  assert.equal(below.perTransaction.net,1970);
  const boundary=calculate("NG","local",2500);
  assert.equal(boundary.breakdown.fixedWaived,false);
  assert.equal(boundary.perTransaction.fee,137.5);
});

test("Nigeria local applies the published total-fee cap",()=>{
  const result=calculate("NG","local",200000,10);
  assert.equal(result.breakdown.capped,true);
  assert.equal(result.perTransaction.fee,2000);
  assert.equal(result.monthly.fee,20000);
});

test("Nigeria international card families remain distinct",()=>{
  assert.equal(calculate("NG","international",10000).perTransaction.fee,490);
  assert.equal(calculate("NG","amex",10000).perTransaction.fee,450);
});

test("Ghana and Kenya use only reviewed country-channel combinations",()=>{
  assert.equal(calculate("GH","local",10000).perTransaction.fee,195);
  assert.equal(calculate("GH","international",10000).perTransaction.fee,195);
  assert.equal(calculate("KE","local",10000).perTransaction.fee,290);
  assert.equal(calculate("KE","mpesa",10000).perTransaction.fee,150);
  assert.equal(calculate("KE","international",10000).perTransaction.fee,380);
});

test("South Africa adds 15% VAT only to published VAT-exclusive fees",()=>{
  const local=calculate("ZA","local",1000);
  assert.equal(local.breakdown.baseFee,30);
  assert.equal(local.breakdown.tax,4.5);
  assert.equal(local.perTransaction.fee,34.5);
  assert.equal(calculate("ZA","eft",1000).perTransaction.fee,23);
  assert.equal(calculate("NG","local",10000).breakdown.tax,0);
});

test("target-net gross-up follows caps and returns at least the requested net",()=>{
  const result=calculate("NG","local",5000,1,200000);
  assert.ok(result.grossUp);
  assert.equal(result.grossUp.charge,202000);
  assert.equal(result.grossUp.fee,2000);
  assert.equal(result.grossUp.net,200000);
  assert.ok(result.grossUp.net>=200000);
  assert.ok(result.grossUp.previousCentNet<200000);
  assert.equal(result.grossUp.method,"minimum-currency-cent");
});

test("gross-up is minimum-cent safe below and across the NGN 2,500 discontinuity",()=>{
  const below=calculate("NG","local",5000,1,2462.49).grossUp;
  assert.deepEqual({charge:below.charge,net:below.net,previous:below.previousCentNet},{charge:2499.99,net:2462.49,previous:2462.48});
  const across=calculate("NG","local",5000,1,2462.5).grossUp;
  assert.deepEqual({charge:across.charge,net:across.net,previous:across.previousCentNet},{charge:2601.52,net:2462.5,previous:2462.49});
});

test("gross-up remains minimum-cent safe at the NGN 2,000 fee cap",()=>{
  const capped=calculate("NG","local",5000,1,124666.67).grossUp;
  assert.deepEqual({charge:capped.charge,fee:capped.fee,net:capped.net,previous:capped.previousCentNet},{charge:126666.67,fee:2000,net:124666.67,previous:124666.66});
});

test("gross-up reconciles the published plus-one-cent formula with exact branch verification",()=>{
  const target=10000,result=calculate("NG","local",5000,1,target).grossUp;
  const publishedFormula=((target+100)/(1-.015))+.01;
  assert.ok(result.charge<=Math.ceil(publishedFormula*100)/100);
  assert.ok(result.net>=target);
  assert.ok(result.previousCentNet<target);
});

test("unsupported combinations, unsafe bounds and stale rules fail closed",()=>{
  assert.deepEqual(engine.calculate({country:"GH",channel:"amex",amount:1000,count:1},fresh).error,"channel");
  assert.deepEqual(engine.calculate({country:"NG",channel:"local",amount:0,count:1},fresh).error,"amount");
  assert.deepEqual(engine.calculate({country:"NG",channel:"local",amount:1000,count:1.5},fresh).error,"count");
  assert.deepEqual(engine.calculate({country:"NG",channel:"local",amount:1000,count:1},new Date("2026-10-22T00:00:00Z")).error,"stale");
});

test("freshness distinguishes review and source dates from an unpublished effective date",()=>{
  assert.deepEqual(engine.freshness(fresh),{fresh:true,reviewedAt:"2026-07-23",sourceUpdatedAt:"2026-05-20",reviewDueAt:"2026-10-21",effectiveDate:null});
});
