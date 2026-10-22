"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Engine = require("../assets/js/lib/car-import-cost-engine.js");
const root = path.join(__dirname,"..");
const read = file => JSON.parse(fs.readFileSync(path.join(root,file),"utf8"));
const pack = read("data/trade/car-import-cost-ng.json");
const core = read("data/trade/car-import-cost-core.json");
const data = Engine.mergeData(core,[pack],{NGN:1334.2233});
const input = {countryCode:"NG",fuelType:"petrol",condition:"used",bodyType:"sedan",engineCc:1800,year:2022,inputMode:"fob",fobUsd:10000,freightUsd:1000,insuranceUsd:100,outputMode:"official",asOfDate:"2026-10-22T12:00:00Z"};
function calc(extra) { return Engine.calculate({...input,...extra},data).nigeriaAssessment; }
for (const [cc,code] of [[1800,"8703232000"],[3982,"8703242000"]]) {
  test("actual NTIP " + code + " scenario reproduces seven-million-NGN charge reference",()=>{
    const result = calc({engineCc:cc,ngHsCode:code});
    assert.equal(result.status,"dated-reference");
    assert.equal(result.hsCode,code);assert.equal(result.totalNgn,7392554.39);
    const amounts = Object.fromEntries(result.rows.map(row=>[row.id,row.amountLocal]));
    assert.deepEqual(amounts,{"ng-import-duty":2961975.73,"ng-etls":74049.39,"ng-surcharge":207338.30,"ng-fcs":533689.32,"ng-vat":1394019.85,"ng-vehicle-levy":2221481.79});
    assert.equal(Math.round(result.vatBaseUsd*1334.2233*100)/100,18586931.37);
    assert.ok(result.rows.every(row=>row.official===false),"Reference must not masquerade as settled current law");
    assert.equal(result.observedAt,"2026-10-22");assert.equal(result.greenTax.amount,null);
  });
}
test("full entered assessment replaces all portal charge rows without double charging",()=>{
  const result=calc({ngAssessmentMode:"quoted-total",ngAssessmentNgn:"7920000.50",ngAssessmentDate:"2026-10-21",ngAssessmentSource:"Synthetic broker assessment A"});
  assert.equal(result.status,"user-assessment");assert.equal(result.totalNgn,7920000.50);
  assert.equal(result.rows.length,1);assert.equal(result.rows[0].id,"ng-entered-assessment");
  assert.equal(result.observedAt,null);assert.equal(result.sourceUrl,null);
  assert.equal(result.assessmentSource,"Synthetic broker assessment A");assert.equal(result.assessmentDate,"2026-10-21");
  assert.equal(result.greenTax.status,"coverage-to-check-with-quote");
});
test("missing malformed nonfinite future or source-free quote never becomes a zero assessment",()=>{
  const valid={ngAssessmentMode:"quoted-total",ngAssessmentNgn:"1",ngAssessmentDate:"2026-10-21",ngAssessmentSource:"Synthetic quote"};
  for(const bad of [{ngAssessmentNgn:""},{ngAssessmentNgn:"-1"},{ngAssessmentNgn:"Infinity"},{ngAssessmentNgn:"1e309"},{ngAssessmentNgn:"12abc"},{ngAssessmentDate:"2026-02-30"},{ngAssessmentDate:"2026-10-23"},{ngAssessmentSource:" "}]) {
    const result=calc({...valid,...bad});assert.equal(result.status,"invalid-quote",JSON.stringify(bad));assert.equal(result.totalNgn,null);assert.equal(result.rows.length,0);
  }
  assert.equal(calc({ngAssessmentMode:"invented"}).status,"invalid-scenario");
});
test("GreenTax threshold uses confirmed exact cc and never invents its monetary base",()=>{
  for(const [cc,rate,status] of [[1999,0,"excluded-by-engine-size"],[2000,.02,"rate-known-base-unconfirmed"],[3999,.02,"rate-known-base-unconfirmed"],[4000,.04,"rate-known-base-unconfirmed"]]) {
    const result=calc({engineCc:cc,ngExactCcConfirmed:true});assert.equal(result.greenTax.rate,rate);assert.equal(result.greenTax.status,status);assert.equal(result.greenTax.amount,null);
  }
  assert.equal(calc({engineCc:4000,ngExactCcConfirmed:false}).greenTax.rate,null);
  assert.equal(calc({engineCc:3982,ngExactCcConfirmed:true}).greenTax.rate,.02,"Exact3982 must not round to4000");
});
test("unsupported classes codes and missing reference do not inherit the old35+35 tax model",()=>{
  for(const bad of [{condition:"new"},{fuelType:"diesel"},{fuelType:"ev"},{bodyType:"pickup"},{bodyType:"mpv"},{engineCc:1500},{engineCc:0},{ngHsCode:"8703242000",engineCc:1800}]) {
    const result=calc(bad);assert.equal(result.status,"unsupported",JSON.stringify(bad));assert.equal(result.rows.length,0);assert.equal(result.totalNgn,null);
  }
  const legacy=JSON.parse(JSON.stringify(pack));delete legacy.nigeriaReference;
  const result=Engine.calculate(input,Engine.mergeData(core,[legacy],{NGN:1334.2233})).nigeriaAssessment;
  assert.equal(result.status,"unsupported");assert.equal(result.rows.length,0);
});
test("legacy dataset FX date is included only when it belongs to the rate actually used",()=>{
  const dated=Engine.mergeData(core,[pack],{NGN:1334.2233});dated.fxObservations={NGN:{rate:1334.2233,source:"Synthetic FX source",observed_at:"2026-10-21T00:00:00Z"}};
  let result=Engine.calculate(input,dated);assert.equal(result.fx.observedAt,"2026-10-21T00:00:00Z");
  result=Engine.calculate({...input,fxRates:{NGN:1500}},dated);assert.equal(result.fx.observedAt,null);assert.equal(result.fx.source,"configured/fallback");
});

// Controller-level contracts use the genuine source in a VM with a small DOM
// adapter. They do not establish browser layout, download or provider acceptance.
function controllerHarness() {
  const vm = require("node:vm");
  const nodes = new Map(), storage = new Map(), blobs = [], pdfs = [], timers = [];
  let networkAttempts = 0;
  function node(selector) {
    if (!nodes.has(selector)) nodes.set(selector,{value:"",checked:false,hidden:false,required:false,innerHTML:"",textContent:"",listeners:{},options:[],
      addEventListener(name,fn){(this.listeners[name] ||= []).push(fn);},
      dispatch(name){for(const fn of this.listeners[name] || [])fn({target:this,preventDefault(){}});},
      appendChild(item){this.options.push(item);},setAttribute(){},getAttribute(){return null;},classList:{toggle(){}}});
    return nodes.get(selector);
  }
  const document = {documentElement:{lang:"en"},body:{getAttribute(){return "NG";}},querySelector:node,querySelectorAll(){return [];},addEventListener(){},
    createElement(tag){if(tag==="a")return {click(){},set href(value){this.url=value;},set download(value){this.name=value;}};return {value:"",textContent:"",selected:false};}};
  const location={href:"http://127.0.0.1/tools/car-import-cost/nigeria/",pathname:"/tools/car-import-cost/nigeria/",search:"",hash:""};
  const localStorage={getItem:key=>storage.has(key)?storage.get(key):null,setItem:(key,value)=>storage.set(key,String(value))};
  class Url extends URL { static createObjectURL(blob){blobs.push(blob);return "blob:synthetic";} static revokeObjectURL(){} }
  const window={AfroCarImportCost:Engine,AfroTools:{pdf:{generate:payload=>pdfs.push(payload)}},setTimeout:fn=>timers.push(fn),print(){throw new Error("Unexpected print");}};
  const context={window,document,location,localStorage,history:{replaceState(a,b,url){location.href=new URL(url,location.href).href;}},URL:Url,URLSearchParams,Intl,Date,Number,String,Object,Array,JSON,Blob,
    navigator:{},fetch(){networkAttempts++;throw new Error("Network denied in controller contract");}};
  let source=fs.readFileSync(path.join(root,"assets/js/car-import-cost.js"),"utf8");
  const tail=source.lastIndexOf("\n}();");assert.ok(tail>0,"Exact IIFE tail required for test-only private-function exposure");
  source=source.slice(0,tail)+'\nwindow.__controller={state:a,calculate:m,restore:f,csv:I,pdf:g,save:b,bind:bindNigeriaRecovery};'+source.slice(tail);
  vm.runInNewContext(source,context,{filename:"actual-car-import-cost-controller.js"});
  const api=window.__controller;api.state.data=data;api.bind();
  Object.entries({carImportCountry:"NG",carImportSourceMarket:"japan",carImportInputMode:"fob",carImportOutputMode:"official",carImportMake:"Synthetic",carImportModel:"Sample",carImportYear:"2022",carImportFuelType:"petrol",carImportEngineCc:"1800",carImportBodyType:"sedan",carImportCondition:"used",carImportFob:"10000",carImportFreight:"1000",carImportInsurance:"100",carImportNgMode:"ntip-reference"}).forEach(([id,value])=>node("#"+id).value=value);
  return {api,node,storage,blobs,pdfs,networkAttempts:()=>networkAttempts};
}
test("actual controller exports dated code and numeric bases to CSV/PDF payloads",async()=>{
  const h=controllerHarness();h.api.calculate();
  assert.equal(h.api.state.lastResult.nigeriaAssessment.totalNgn,7392554.39);
  assert.match(h.node("#carImportSummaryLine").textContent,/8703232000/);
  assert.match(h.node(".car-import-total-label").textContent,/Planning budget/);
  h.api.csv();const csv=await h.blobs[0].text();
  assert.match(csv,/reference_checked/);assert.match(csv,/2026-10-22/);assert.match(csv,/8703232000/);
  assert.match(csv,/base_usd/);assert.match(csv,/0\.005/);assert.match(csv,/1394019\.85/);
  assert.match(csv,/exact-displacement-unconfirmed/);assert.match(csv,/7,392,554|7392554\.39/);
  h.api.pdf();const report=h.pdfs[0];
  assert.ok(report.sections.some(section=>section.heading==="Calculation basis and source dates"));
  const basis=report.sections.find(section=>section.heading==="Calculation basis and source dates").rows;
  assert.ok(basis.some(row=>row[0]==="reference checked"&&row[1]==="2026-10-22"));
  assert.ok(basis.some(row=>row[0].includes("VAT")&&row[1].includes("rate 7.5%")));
  assert.equal(h.networkAttempts(),0);
});
test("actual controller saves and restores assessment basis then invalidates edited or invalid output",async()=>{
  const h=controllerHarness();h.node("#carImportNgMode").value="quoted-total";
  h.node("#carImportNgAssessmentNgn").value="7920000.50";h.node("#carImportNgAssessmentDate").value="2026-10-21";
  h.node("#carImportNgAssessmentSource").value='Synthetic broker "A", reference1';h.node("#carImportNgExactCc").checked=true;
  h.api.calculate();assert.equal(h.api.state.lastResult.nigeriaAssessment.totalNgn,7920000.50);
  h.api.save();const saved=JSON.parse(h.storage.get("carImportCostLastInput"));
  assert.equal(saved.ngAssessmentNgn,"7920000.50");assert.equal(saved.ngAssessmentMode,"quoted-total");assert.equal(saved.ngExactCcConfirmed,true);
  const reopened=controllerHarness();reopened.api.restore(saved);reopened.api.calculate();
  assert.equal(reopened.api.state.lastResult.nigeriaAssessment.totalNgn,7920000.50);
  assert.equal(reopened.node("#carImportNgAssessmentSource").value,'Synthetic broker "A", reference1');
  reopened.api.csv();const csv=await reopened.blobs[0].text();assert.match(csv,/7920000\.5/);assert.match(csv,/2026-10-21/);assert.match(csv,/Synthetic broker ""A"", reference1/);
  reopened.node("#carImportNgAssessmentNgn").value="-1";reopened.node("#carImportForm").dispatch("input");
  assert.equal(reopened.api.state.lastResult,null);assert.equal(reopened.node("#carImportResults").hidden,true);
  reopened.api.csv();assert.equal(reopened.blobs.length,1,"No export after invalid edit");assert.equal(reopened.node("#carImportNgError").hidden,false);
  reopened.node("#carImportNgAssessmentNgn").value="8000000";reopened.api.calculate();
  assert.equal(reopened.node("#carImportNgError").hidden,true);assert.equal(reopened.node("#carImportResults").hidden,false);
  assert.equal(reopened.api.state.lastResult.nigeriaAssessment.totalNgn,8000000);assert.equal(reopened.networkAttempts(),0);
});
test("actual controller labels unsupported class as pre-tax and never presents a settled tax total",()=>{
  const h=controllerHarness();h.node("#carImportFuelType").value="diesel";h.api.calculate();
  assert.equal(h.api.state.lastResult.breakdowns.officialTaxes.length,0);
  assert.equal(h.node(".car-import-total-label").textContent,"Pre-tax planning budget");
  assert.match(h.node("#carImportSummaryLine").textContent,/Customs charges not included/);
  assert.equal(h.api.state.lastResult.badges[0].label,"unassessed taxes");
});

test("a full entered assessment works for unverified vehicle classes without inferred petrol HS or GreenTax",()=>{
  for(const extra of [{fuelType:"diesel"},{condition:"new"},{engineCc:1500},{bodyType:"pickup"}]) {
    const result=calc({...extra,ngAssessmentMode:"quoted-total",ngAssessmentNgn:"5000000",ngAssessmentDate:"2026-10-21",ngAssessmentSource:"Synthetic Customs assessment",ngExactCcConfirmed:true});
    assert.equal(result.status,"user-assessment");assert.equal(result.totalNgn,5000000);assert.equal(result.rows.length,1);
    assert.equal(result.greenTax.rate,null);assert.equal(result.greenTax.status,"coverage-to-check-with-quote");
    assert.equal(result.hsCode,"","Do not infer petrol classification for another class");
  }
});
test("fixed NGN assessment is not scaled with USD FX or generic best/painful assumptions",()=>{
  const result=Engine.calculate({...input,ngAssessmentMode:"quoted-total",ngAssessmentNgn:"7920000.50",ngAssessmentDate:"2026-10-21",ngAssessmentSource:"Synthetic quote"},data);
  const variableUsd=result.totals.onRoadUsd-result.totals.officialTaxesUsd;
  for(const row of result.sensitivity.exchangeRate) {
    assert.equal(row.totalLocal,Math.round(variableUsd*row.fxRate+7920000.50));
    assert.match(row.assumption,/assessment stays fixed/);
  }
  assert.equal(result.totals.onRoadLocal,Math.round(variableUsd*result.fx.usdToLocal+7920000.50));
  assert.equal(result.scenarios.length,1);assert.equal(result.scenarios[0].id,"entered-assessment");
  assert.equal(result.sourceMarketCompare,undefined,"A quote for one car/source must not be reused for other source comparisons");
});
