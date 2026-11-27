'use strict';
const assert=require('node:assert/strict'),{test}=require('node:test');
const data=require('../data/agriculture/crop-yield-tool-data'),engine=require('../engines/src/crop-yield-tool-engine');
const form=require('../assets/js/pages/sw-crop-yield-form'),{renderCropYieldForm}=require('../scripts/lib/sw-crop-yield-form');
const input={crop:'maize',sizeUnit:'ha',currency:'KES',farmSize:1,yieldPerHa:4,marketPrice:40000,inputCosts:90000};
test('independent one/two hectare arithmetic keeps total costs unchanged',()=>{
  for(const size of [1,2]){const r=engine.calculate(form.validate({...input,farmSize:size},data),data);assert.equal(r.totalYield,size*4);assert.equal(r.grossRevenue,size*160000);assert.equal(r.netProfit,size*160000-90000);assert.equal(r.input.inputCosts,90000);}
});
test('zero costs is allowed, zero area/yield/price and malformed or negative costs rejected',()=>{
  assert.equal(engine.calculate(form.validate({...input,inputCosts:0},data),data).roi,null);
  for(const key of ['farmSize','yieldPerHa','marketPrice','inputCosts'])for(const value of ['',null,[],true,Infinity,'1e999',-1,'oops'])assert.throws(()=>form.validate({...input,[key]:value},data));
  for(const key of ['farmSize','yieldPerHa','marketPrice'])assert.throws(()=>form.validate({...input,[key]:0},data));
});
test('explicit unit conversion and losses preserve shared engine behavior',()=>{
  const acres=engine.calculate(form.validate({...input,sizeUnit:'acres'},data),data);assert.equal(acres.sizeHa,0.404686);
  const loss=engine.calculate(form.validate({...input,inputCosts:200000},data),data);assert.equal(loss.netProfit,-40000);assert.equal(loss.roi,-20);
  for(const key of ['crop','sizeUnit','currency'])assert.throws(()=>form.validate({...input,[key]:'constructor'},data));
});
test('only crop-yield projection replaces raw editor and keeps all report formats',()=>{
  const html='<head></head><h2>Hali ya kupanga</h2><textarea></textarea></section><aside class="swa-card">keep</aside><script src="/assets/js/pages/sw-agriculture-assigned-parity.js"></script>';
  const next=renderCropYieldForm({id:'crop-yield',input},html);assert.doesNotMatch(next,/<textarea/);for(const key of Object.keys(input))assert.match(next,new RegExp(`id="${key}"`));assert.doesNotMatch(next, /\bname=/);for(const type of ['pdf','csv','json','txt'])assert.match(next,new RegExp(`data-export="${type}"`));assert.match(next,/data-import/);assert.equal(renderCropYieldForm({id:'storage-loss'},html),html);assert.throws(()=>renderCropYieldForm({id:'crop-yield',input},''));
});
