'use strict';
const assert=require('node:assert/strict'),engine=require('../engines/src/soil-ph-engine'),data=require('../data/agriculture/soil-ph-data.json');
const valid={ph:5.2,cropKey:'maize',texture:'loam',depth:15,limeQuality:90,farmHa:1,limePrice:50};let checks=0;
for(const input of [null,undefined,[],true,'5.2',...['ph','depth','limeQuality','farmHa','limePrice'].flatMap(key=>[null,'5',true,NaN,Infinity,-Infinity].map(value=>({...valid,[key]:value}))),...['depth','limeQuality','farmHa'].flatMap(key=>[0,-1].map(value=>({...valid,[key]:value}))),{...valid,limePrice:-1},{...valid,ph:2.9},{...valid,ph:10.1},...['cropKey','texture'].flatMap(key=>['constructor','__proto__','missing',null].map(value=>({...valid,[key]:value})))]){assert.deepEqual(engine.calculate(input,data),{ok:false,status:'invalid-input'});checks++;}
for(const field of ['cropKey','texture','depth','limeQuality','farmHa','limePrice']){const input={...valid};delete input[field];assert.equal(engine.calculate(input,data).ok,true);checks++;}
const zero=engine.calculate({...valid,limePrice:0},data);assert.equal(zero.ok,true);assert.equal(zero.lime.rateBasis,'not-determined-from-ph');checks++;
for(const quality of [30,85,90,100,109]){assert.equal(engine.calculate({...valid,limeQuality:quality},data).ok,true);checks++;}
console.log(JSON.stringify({tool:'soil-ph-calculator',boundaryChecks:checks,status:'passed'}));
