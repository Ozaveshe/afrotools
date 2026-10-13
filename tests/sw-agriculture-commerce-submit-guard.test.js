'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const install=require('../assets/js/lib/sw-agriculture-commerce-submit-guard');
const contracts={
  'coffee-calculator':['CoffeeEngine',['gradeInfo','calcYield','qualityImprovement','processingCost'],'AgroCoffeeForm','COFFEE_DATA'],
  'cooperative-calculator':['CooperativeEngine',['calculate'],'AgroCooperativeForm'],
  'warehouse-receipt':['WarehouseReceiptEngine',['calculate'],'AgroWarehouseReceiptForm','WAREHOUSE_RECEIPT_DATA']
};
function fixture(id){
  const submit={disabled:true},note={hidden:false},status={},exports=[{}],listeners=[];
  const form={querySelector:()=>submit,addEventListener:(...args)=>listeners.push(args)};
  const host={getAttribute:()=>id,querySelector:selector=>selector.includes('guard')?form:selector.includes('note')?note:status,querySelectorAll:()=>exports};
  const c=contracts[id],win={document:{querySelector:()=>host},__SW_AGRI_CONFIG__:{id},__SW_AGRI_TEST__:{run(){},getLatest(){},report(){}},AfroTools:{[c[0]]:Object.fromEntries(c[1].map(method=>[method,()=>{}]))},[c[2]]:{create(){}}};
  if(c[3])win[c[3]]={};
  return {win,submit,note,status,exports,listeners,c};
}
let cases=0;
for(const id of Object.keys(contracts))for(const loss of ['healthy','engine','helper','controller','method','identity',...(contracts[id][3]?['data']:[])]){
  const f=fixture(id);
  if(loss==='engine')delete f.win.AfroTools[f.c[0]];
  if(loss==='helper')delete f.win[f.c[2]];
  if(loss==='controller')delete f.win.__SW_AGRI_TEST__;
  if(loss==='method')delete f.win.AfroTools[f.c[0]][f.c[1][0]];
  if(loss==='identity')f.win.__SW_AGRI_CONFIG__.id='unknown';
  if(loss==='data')delete f.win[f.c[3]];
  install(f.win);
  assert.equal(f.submit.disabled,loss!=='healthy');
  assert.equal(f.note.hidden,loss==='healthy');
  assert.equal(f.listeners.length,1);assert.equal(f.listeners[0][2],true);
  let prevented=false,stopped=false;f.listeners[0][1]({preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});
  assert(prevented);assert.equal(stopped,loss!=='healthy');
  if(loss!=='healthy'){assert.equal(f.exports[0].disabled,true);assert(f.status.textContent.includes('Ingizo halijatumwa'));}
  cases++;
}
const controller=fs.readFileSync(require.resolve('../assets/js/pages/sw-agriculture-commerce'),'utf8');
const hook=controller.indexOf('window.__SW_AGRI_TEST__=');assert.equal(hook,controller.lastIndexOf('window.__SW_AGRI_TEST__='));
for(const binding of ['form.addEventListener("submit"','form.addEventListener("reset"','root.addEventListener("click"','root.addEventListener("change"'])assert(controller.lastIndexOf(binding)<hook);
const {apps,render}=require('../scripts/build-sw-agriculture-assigned-apps');
for(const app of apps){const html=render(app),commerce=Object.hasOwn(contracts,app.id);assert.equal(html.includes('data-commerce-submit-guard="1"'),commerce);assert.equal(html.includes('data-commerce-script-note'),commerce);if(commerce){assert(!html.includes('id="scenario" name="scenario"'));assert(html.includes('type="submit" disabled'));}}
console.log(JSON.stringify({guardCases:cases,staticAppContracts:apps.length,genuinePostBindingHook:true}));
