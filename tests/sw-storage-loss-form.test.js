'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { test } = require('node:test');
const runtime = require('../assets/js/pages/sw-storage-loss-form');
const { renderStorageLossForm } = require('../scripts/lib/sw-storage-loss-form');
const engine = require('../engines/src/storage-loss-engine');
const context = {};
vm.runInNewContext(fs.readFileSync(require.resolve('../data/agriculture/storage-data.js'),'utf8'), context);
const data=context.STORAGE_DATA;
const input={crop:'maize',countryCode:'KE',methodKey:'traditional_granary',quantityTonnes:2,durationMonths:6,pricePerTonne:40000};

test('known maize scenario matches independent mass and value arithmetic',()=>{
  const r=engine.calculate(runtime.validate(input,data),data);
  assert.equal(r.currentLossTonnes,2*20/100);
  assert.equal(r.currentLossVal,16000);
  assert.ok(Math.abs(r.picsLossTonnes-2*(1*6/9)/100)<1e-12);
  assert.ok(Math.abs(r.picsValSaved-(16000-(2*(1*6/9)/100)*40000))<1e-8);
  assert.equal(r.siloLossVal,200);
  assert.equal(r.siloValSaved,15800);
  assert.equal(r.picsTotalCost,20*350);
  assert.equal(r.siloCostLocal,2*22000);
  assert.equal(runtime.rows(r).length,3);
  assert.match(runtime.reportText(input,r),/16,000/);
  assert.match(runtime.reportText(input,r),/matumizi moja kati ya 3/);
});

test('validation rejects missing, negative, nonfinite, boolean and fractional duration',()=>{
  for(const field of ['quantityTonnes','durationMonths','pricePerTonne']){
    for(const value of ['', ' ',0,-1,null,true,[],{},Infinity,'1e999']){
      assert.throws(()=>runtime.validate({...input,[field]:value},data));
    }
  }
  assert.throws(()=>runtime.validate({...input,durationMonths:1.5},data));
  assert.equal(runtime.validate({...input,quantityTonnes:0.25},data).quantityTonnes,0.25);
  assert.equal(runtime.validate({...input,durationMonths:18},data).durationMonths,18);
});

test('crop-specific methods, country identity and prototype keys fail closed',()=>{
  assert.throws(()=>runtime.validate({...input,crop:'wheat'},data));
  for(const key of ['constructor','__proto__','unknown']){
    assert.throws(()=>runtime.validate({...input,crop:key},data));
    assert.throws(()=>runtime.validate({...input,countryCode:key},data));
    assert.throws(()=>runtime.validate({...input,methodKey:key},data));
  }
  assert.equal(runtime.validate({...input,crop:'wheat',methodKey:'metal_silo'},data).crop,'wheat');
  assert.throws(()=>runtime.validate({...input,countryCode:'EMPTY'},{...data,countries:{...data.countries,EMPTY:null}}));
});

test('projection removes JSON editing only for storage and keeps report actions',()=>{
  const old='<head></head><h2>Hali ya kupanga</h2><textarea id="scenario"></textarea></section><aside class="swa-card">unchanged</aside><script src="/assets/js/pages/sw-agriculture-assigned-parity.js"></script>';
  const html=renderStorageLossForm({id:'storage-loss',input},old);
  assert.doesNotMatch(html,/<textarea/);
  for(const field of Object.keys(input))assert.match(html,new RegExp(`name="${field}"`));
  for(const type of ['json','pdf','csv','txt'])assert.match(html,new RegExp(`data-export="${type}"`));
  assert.match(html,/data-local-submit-guard="1"/);
  assert.match(html,/data-import/);
  assert.match(html,/unchanged/);
  assert.equal(renderStorageLossForm({id:'farm-budget'},old),old);
  assert.throws(()=>renderStorageLossForm({id:'storage-loss',input},'<p>unexpected owner</p>'));
});
