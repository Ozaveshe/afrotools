'use strict';
const assert=require('node:assert/strict'),data=require('../data/agriculture/crop-yield-tool-data.json'),engine=require('../engines/src/crop-yield-tool-engine');
const input={crop:'maize',sizeUnit:'ha',currency:'KES',farmSize:1,yieldPerHa:4,marketPrice:40000,inputCosts:90000};let profiles=0;
for(const crop of Object.keys(data.crops))for(const sizeUnit of ['ha','acres','plots'])for(const currency of Object.keys(data.symbols))for(const farmSize of [.5,5,50]){const r=engine.calculate({...input,crop,sizeUnit,currency,farmSize},data);assert.equal(r.ok,true);assert.equal(r.totalYield,r.sizeHa*4);profiles++;}
for(const key of ['farmSize','yieldPerHa','marketPrice','inputCosts'])for(const bad of [null,true,false,[],{},'12garbage','1,00',Infinity,NaN,-1])assert.equal(engine.calculate({...input,[key]:bad},data).ok,false,key+' '+String(bad));
for(const key of ['crop','currency'])for(const bad of ['constructor','__proto__','toString','unknown',[],{}])assert.equal(engine.calculate({...input,[key]:bad},data).ok,false);
for(const sizeUnit of ['unknown','constructor','',null])assert.equal(engine.calculate({...input,sizeUnit},data).status,'invalid-unit');
assert.equal(engine.calculate({...input,farmSize:1e-7},data).sizeHa,1e-7);assert.equal(engine.calculate({...input,farmSize:'1e-7'},data).sizeHa,1e-7);
assert.equal(engine.parseNumber('1,000'),1000);assert.equal(engine.parseNumber('12,345.67'),12345.67);assert.equal(engine.calculate({...input,inputCosts:0},data).roi,null);assert.equal(engine.calculate({...input,inputCosts:''},data).netProfit,160000);
assert.equal(engine.calculate({...input,inputCosts:undefined},data).netProfit,160000);assert.equal(engine.calculate({...input,inputCosts:200000},data).netProfit,-40000);
assert.equal(engine.calculate({...input,farmSize:1e308},data).status,'out-of-range');
assert.equal(engine.calculate({farmSize:0},data).status,'missing-size');assert.equal(engine.calculate({farmSize:1,yieldPerHa:0},data).status,'missing-yield');assert.equal(engine.calculate({farmSize:1,yieldPerHa:1,marketPrice:0},data).status,'missing-price');
console.log(JSON.stringify({profiles,rejectedInvalidCases:56,scientificNotation:true,zeroCostsAndLoss:true,overflowRejected:true}));
