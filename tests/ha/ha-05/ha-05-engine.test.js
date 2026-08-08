"use strict";
const test=require("node:test");
const assert=require("node:assert/strict");
const h=require("../../../ha/assets/ha-05-telecom-commerce.js");

test("mobile money da banki suna bin tsarin English owner",()=>{
  assert.deepEqual(h.compareFees(10000,50,1,25,.5),{amount:10000,mobileFee:150,bankFee:75,mobileEffectivePct:1.5,bankEffectivePct:.75,cheaper:"banki",difference:75});
  assert.throws(()=>h.compareFees(0,0,0,0,0),/fi sifili/);
});

test("amfani da data yana amfani da constants da kariya 10%",()=>{
  assert.deepEqual(h.dataUsage({browsing:1,social:1,youtube:1,quality:"medium",music:1,videocall:1,email:10,downloads:1}),{dailyMB:1587,monthlyGB:47.49,recommendedGB:52.24,quality:"medium"});
  assert.equal(h.dataUsage({youtube:1,quality:"hd"}).dailyMB,2500);
});

test("airtime da mobile money suna kin alkaluma marasa inganci",()=>{
  assert.deepEqual(h.airtimeValue(10000,70,85),{amount:10000,minRate:70,maxRate:85,low:7000,high:8500});
  assert.throws(()=>h.airtimeValue(100,90,80),/karami/);
  assert.deepEqual(h.mobileMoneyFees(10000,50,1,100,.5),{amount:10000,sendFee:150,cashoutFee:150,totalFee:300,netAfterFees:9700,effectivePct:3});
});

test("kwandon kaya yana tara layuka masu amfani kawai",()=>{
  assert.deepEqual(h.basketTotal([{name:"Shinkafa",quantity:2,price:3000},{name:"Wake",quantity:1,price:2000},{name:"Babu",quantity:0,price:99}]),{items:[{name:"Shinkafa",quantity:2,price:3000,total:6000},{name:"Wake",quantity:1,price:2000,total:2000}],total:8000});
  assert.throws(()=>h.basketTotal([{name:"Babu",quantity:0,price:0}]),/a kalla/);
});

test("Naira zuwa kalmomi yana fitar da Hausa ba Turanci ba",()=>{
  assert.equal(h.hausaInteger(0),"sifili");
  assert.equal(h.hausaInteger(21),"ashirin da ɗaya");
  assert.equal(h.hausaInteger(405),"ɗari huɗu da biyar");
  assert.equal(h.nairaWords(125.75),"Naira ɗari da ashirin da biyar da Kobo saba'in da biyar kacal");
  assert.doesNotMatch(h.nairaWords(1000),/one|hundred|thousand/i);
});

test("remittance yana bin fee da FX margin semantics",()=>{
  assert.deepEqual(h.remittance(100,1500,{flat:2,feePct:1,marginPct:2}),{fee:3,effectiveRate:1470,received:142590});
});

test("WhatsApp yana tsabtace lamba kuma baya aiwatar da budewa",()=>{
  const result=h.whatsappLink("+234","080 1234 5678","Sannu kawai");
  assert.equal(result.url,"https://wa.me/2348012345678?text=Sannu%20kawai");
  assert.match(result.masked,/5678$/);
  assert.throws(()=>h.whatsappLink("234","12",""),/7 zuwa 15/);
});

test("telecom rows suna fitowa daga source owner ba hard-code ba",()=>{
  const data={countries:{NG:{operators:[{name:"Kamfani",dataBundles:[{name:"1GB",volume:"1GB",volumeMB:1024,validity:"30 days",price:500}]}],ussdCodes:{balance:{Kamfani:"*123#"}}}}};
  assert.deepEqual(h.planRows(data,"NG","30 day"),[{operator:"Kamfani",bundle:"1GB",volume:"1GB",validity:"30 days",price:500,pricePerGB:500,code:""}]);
  assert.deepEqual(h.ussdRows(data,"NG","balance"),[{category:"balance",provider:"Kamfani",code:"*123#"}]);
});
