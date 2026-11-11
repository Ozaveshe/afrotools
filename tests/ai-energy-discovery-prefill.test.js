"use strict";
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const adapters = require("../assets/js/ai/prefill-adapters.js");
const router = require("../assets/js/ai/intent-router.js");
const manifestApi = require("../assets/js/ai/tool-manifest.js");
const runtime = require("../assets/js/ai/tool-invocation-runtime.js");
const manifest = manifestApi.loadDefaultToolManifest();
const matrix = [
  ["fuel prices Nigeria", "fuel-tracker", "/tools/fuel-tracker/"],
  ["petrol price in Ghana", "fuel-tracker", "/tools/fuel-tracker/"],
  ["diesel price in Kenya", "fuel-tracker", "/tools/fuel-tracker/"],
  ["Generator fuel cost for diesel in Kenya", "generator-fuel", "/tools/generator-fuel/"],
  ["Diesel generator running 6 hours per day in Lagos", "generator-fuel", "/tools/generator-fuel/"],
  ["5 kVA generator consumption for 4.5 hours daily in Ghana", "generator-fuel", "/tools/generator-fuel/"],
  ["Solar payback for a Nigeria home with a monthly electricity bill of 120000 NGN", "solar-roi", "/tools/solar-roi/nigeria/"],
  ["solar ROI and generator backup costs in Nigeria", "solar-roi", "/tools/solar-roi/nigeria/"],
  ["Compare solar vs generator costs for a Lagos shop", "solar-roi", "/tools/solar-roi/nigeria/"],
  ["Compare sola na jenereta Kenya", "solar-vs-generator", "/tools/solar-vs-generator/"],
  ["bajeti ya kuishi Kenya", "cost-of-living", "/tools/cost-of-living/"],
];
for (const [query, id, route] of matrix) {
  const d = router.routeDeterministically(query, { manifest });
  assert.equal(d.selectedToolId, id, query);
  const tool = manifest.find(t => t.id === id);
  assert.ok(tool.title);
  const call = manifestApi.buildToolInvocation(tool, {providedInputNames:Object.keys(d.extractedInputs),missingInputNames:d.missingInputs});
  const result = runtime.buildExecution({toolCall:call, selectedToolId:id,selectedRoute:d.selectedRoute,extractedInputs:d.extractedInputs,missingInputs:d.missingInputs});
  assert.equal(result.toolId, id, query);
  assert.equal(new URL(result.launchUrl,"https://afrotools.com").pathname, route, query);
  if (id === "fuel-tracker" || id === "generator-fuel") assert.ok(!result.missingInputs.includes("monthlyBill"),query);
}
for (const query of ["Kerosene cost in Uganda", "LPG prices Nigeria", "cooking gas price Ghana"]) {
  const recovery = router.routeDeterministically(query, {manifest});
  assert.equal(recovery.selectedToolId, "tool-search");
  assert.equal(recovery.canPrefill, false);
  assert.equal(recovery.confidence, 0);
  assert.match(recovery.reasonShort, /not kerosene or LPG/);
  assert.match(recovery.clarificationQuestion, /dated local supplier quote/);
  const normalized = router.normalizeDecision({selectedToolId:"fuel-tracker"},query,{manifest});
  assert.equal(normalized.selectedToolId,"tool-search");
}
const generator = router.routeDeterministically(matrix[5][0], {manifest});
assert.equal(generator.extractedInputs.generatorHoursPerDay, 4.5);
assert.equal(generator.extractedInputs.generatorSizeKva, 5);
assert.equal(generator.extractedInputs.country, "Ghana");

function field(tag, value, options = [], extras = {}) {
  const listeners = {};
  return Object.assign({tagName:tag,value,options:options.map(v=>({value:v,textContent:v})),disabled:false,
    type:tag==="INPUT"?"number":"select-one",min:"",max:"",step:"",closest:()=>null,
    addEventListener(type,fn){(listeners[type] ||= []).push(fn);},
    dispatchEvent(event){for(const fn of listeners[event.type]||[])fn(event);},
    edit(value){this.value=value;this.dispatchEvent({type:"input",isTrusted:true});}
  },extras);
}
function consumer(id, inputs, fields) {
  const timers=[], notice={textContent:""};
  const payload=adapters.buildSafeLaunch(id,inputs).payload;
  const document={readyState:"complete",body:{},querySelector:()=>({}),
    getElementById:key=>key==="afrotools-ai-prefill-notice"?{querySelector:()=>notice}:fields[key]||null};
  const context={document,URLSearchParams,Event:class {constructor(type){this.type=type;this.isTrusted=false;}},
    location:{pathname:`/tools/${id}/`,search:"?source=ask&prefill=1"},
    AfroToolsAIPrefillAdapters:{readLaunchPayload:()=>payload},
    setTimeout:(fn,delay)=>timers.push({fn,delay}),addEventListener:()=>{}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,"../assets/js/ai/prefill-consumer.js"),"utf8"),context);
  return {notice,retry(){const work=timers.splice(0);for(const item of work)item.fn();}};
}
const delayedCountry=field("SELECT","",[],{disabled:true});
const fuel=field("SELECT","petrol",["petrol","diesel"]);
const delayed=consumer("fuel-tracker",{country:"Kenya",fuelType:"diesel"},{"fuel-country":delayedCountry,"fuel-type":fuel});
assert.equal(delayedCountry.value,"");assert.equal(fuel.value,"petrol");
delayedCountry.disabled=false;delayedCountry.options=[{value:"NG",textContent:"Nigeria"},{value:"KE",textContent:"Kenya"}];
delayed.retry();assert.equal(delayedCountry.value,"KE");assert.equal(fuel.value,"diesel");
assert.match(delayed.notice.textContent,/Applied prefill fields: country, fuelType/);
fuel.edit("petrol");delayedCountry.edit("NG");delayed.retry();assert.equal(fuel.value,"petrol");assert.equal(delayedCountry.value,"NG");

const waiting=field("SELECT","NG",["NG","KE"],{disabled:true});const edited=field("SELECT","petrol",["petrol","diesel"]);
const pending=consumer("fuel-tracker",{country:"Kenya",fuelType:"diesel"},{"fuel-country":waiting,"fuel-type":edited});
edited.edit("petrol");waiting.disabled=false;pending.retry();assert.equal(edited.value,"petrol");assert.equal(waiting.value,"KE");
assert.doesNotMatch(pending.notice.textContent,/Applied prefill fields: country, fuelType/);

function generatorFields(){return {gfCountry:field("SELECT","NG",["NG","GH","KE"]),gfFuel:field("SELECT","petrol",["petrol","diesel"]),gfKva:field("SELECT","2",["2","5","10","20","50"]),gfHours:field("INPUT","6",[],{min:"0.5",max:"24",step:"0.5"})};}
const gf=generatorFields();consumer("generator-fuel",{country:"Ghana",fuelType:"diesel",generatorSizeKva:5,generatorHoursPerDay:4.5},gf);
assert.deepEqual(Object.values(gf).map(f=>f.value),["GH","diesel","5","4.5"]);
for (const hours of [0,0.25,24.5,25]) {const f=generatorFields();consumer("generator-fuel",{country:"Kenya",generatorHoursPerDay:hours},f);assert.equal(f.gfHours.value,"6");}
const unsupported=generatorFields();consumer("generator-fuel",{country:"Ghana",fuelType:"kerosene",generatorSizeKva:3},unsupported);assert.equal(unsupported.gfFuel.value,"petrol");assert.equal(unsupported.gfKva.value,"2");
const shortCountry=field("SELECT","NG",["NG","KE"]);consumer("fuel-tracker",{country:"K"},{"fuel-country":shortCountry,"fuel-type":fuel});assert.equal(shortCountry.value,"NG");

const solar=adapters.buildSafeLaunch("solar-roi",{country:"Nigeria",monthlyBill:120000,loadSizeKw:5,generatorHoursPerDay:6,fuelType:"diesel"});
assert.equal(solar.toolId,"solar-roi");assert.equal(solar.route,"/tools/solar-roi/nigeria/");assert.equal(solar.payload.normalizedInputs.monthlyBill,120000);
const page=fs.readFileSync(path.join(__dirname,"../ai/index.html"),"utf8");
const block=page.slice(page.indexOf('target.querySelectorAll("[data-energy-generator-link]")'),page.indexOf('target.querySelectorAll("[data-energy-brief-download]")'));
assert.match(block,/buildToolPrefillUrl\("generator-fuel", inputs, \{\}, "\/tools\/generator-fuel\/"\)/);
assert.match(block,/storeAndOpen\("generator-fuel"/);assert.doesNotMatch(block,/fuel-tracker|#generator-cost/);
console.log("Energy discovery: 10 actual router/runtime identities, extracted hours/size, live-selector delayed prefill, user-edit preservation, unsupported/step bounds and solar control passed.");

const fuelBuilder=require("../scripts/build-fuel-market-locales.js");
const core=require("../assets/js/bundles/manifest.json").core;
assert.ok(core.files.includes("assets/js/ai/prefill-adapters.js"));
assert.ok(core.files.includes("assets/js/ai/prefill-consumer.js"));
const bundle=fs.readFileSync(path.join(__dirname,"..",core.path.slice(1)),"utf8");
assert.match(bundle,/AfroToolsAIPrefillAdapters/);
assert.match(bundle,/afrotools-ai-prefill-notice/);

function assertDestinationPrefill(html) {
  if (html.includes('src="'+core.path+'" defer')) return;
  assert.match(html,/src="\/assets\/js\/ai\/prefill-adapters\.js(?:\?v=[a-f0-9]{8})?" defer/);
  assert.match(html,/src="\/assets\/js\/ai\/prefill-consumer\.js(?:\?v=[a-f0-9]{8})?" defer/);
}
for (const owner of ["tools/fuel-tracker/index.html","tools/generator-fuel/index.html"]) {
  const html=fs.readFileSync(path.join(__dirname,"..",owner),"utf8");
  assertDestinationPrefill(html);
  if (owner.includes("fuel-tracker")) assertDestinationPrefill(fuelBuilder.build(html,"en"));
}
console.log("Fuel destinations load the prefill modules through the reviewed core bundle or standalone scripts.");

const solarCountries=require("../data/energy/solar-roi-country-dataset.js").countries;
for (const country of Object.values(solarCountries)) {
  const launch=adapters.buildSafeLaunch("solar-roi",{country:country.countryName,monthlyBill:12345,loadSizeKw:3});
  assert.equal(launch.route,`/tools/solar-roi/${country.slug}/`);
  const html=fs.readFileSync(path.join(__dirname,"..",`tools/solar-roi/${country.slug}/index.html`),"utf8");
  assert.match(html,/id="monthlyBill"/);
  assert.match(html,/id="systemKW"/);
}
assert.equal(adapters.buildSafeLaunch("solar-roi",{country:"Unknown",countrySlug:"../../wrong"}).route,"/tools/solar-roi/");
assert.equal(router.routeDeterministically("Solar Nigeria monthly bill 120000 NGN and 5 kW load",{manifest}).extractedInputs.loadSizeKw,5);
console.log("Solar routes: all54 existing dataset country pages contain the actual bill/system controls; unknown routes fall back to country selection.");

// Execute the actual maintained submit handler: unsupported recovery must stop
// before low-confidence catalog fallback can substitute an unrelated calculator.
const handler=page.slice(page.indexOf("    function routeQuery(query, options)"),page.indexOf("    function updateUrl(query)"));
for(const query of ["Kerosene cost in Uganda","LPG prices Nigeria"]) {
  const calls=[];
  const context={routeGeneration:0,lastClarificationShownKey:"",workflowState:null,activeMatch:{},
    window:{AfroToolsAIGuardrails:{inspectPrompt:()=>({allowed:true})},AfroToolsAIIntentRouter:router},
    updateUrl:q=>calls.push(["query",q]),clearWorkflowCards:()=>{},setState:s=>calls.push(["state",s]),
    showConsentCard:v=>calls.push(["consent",v]),createEmptyWorkflowState:()=>({}),
    callRouter:()=>{throw Error("unsupported fuel must not dispatch provider routing")}};
  vm.runInNewContext(handler+";routeQuery("+JSON.stringify(query)+",{});",context);
  assert.equal(context.workflowState.originalQuery,query);
  assert.equal(context.activeMatch,null);
  assert.ok(calls.some(row=>row[0]==="state"&&row[1]==="unsupportedFuel"));
  assert.ok(calls.some(row=>row[0]==="consent"&&row[1]===false));
}
console.log("Actual submit handler keeps unsupported-fuel recovery ahead of catalog/provider fallback.");

const noGhanaCountry=field("SELECT","NG",["NG","KE"]), noGhanaFuel=field("SELECT","petrol",["petrol","diesel"]);
const unavailable=consumer("fuel-tracker",{country:"Ghana",fuelType:"diesel"},{"fuel-country":noGhanaCountry,"fuel-type":noGhanaFuel});
assert.equal(noGhanaCountry.value,"NG");assert.equal(noGhanaFuel.value,"petrol");
assert.match(unavailable.notice.textContent,/No matching country reference for Ghana/);
assert.match(unavailable.notice.textContent,/current selector is not a reference for your requested country/);
assert.doesNotMatch(unavailable.notice.textContent,/Applied prefill fields/);

assert.doesNotMatch(unavailable.notice.textContent,/Prefill details are ready|Fuel price lookup; Country: Ghana/);

// Real browser calibration globals must not replace an explicit fuel task with
// a geographically matching agricultural tool. Preserve calibration elsewhere.
const savedConfidence=globalThis.AfroConfidence, savedData=globalThis.AFRO_DATA;
try {
  vm.runInThisContext(fs.readFileSync(path.join(__dirname,"../assets/js/ai/afro-confidence.js"),"utf8"));
  vm.runInThisContext(fs.readFileSync(path.join(__dirname,"../assets/js/ai/afro-data.js"),"utf8"));
  const orchestration=require("../assets/js/ai/orchestrator.js");
  for(const query of ["fuel prices South Africa","fuel prices Ghana","diesel price in Kenya","petrol price Mauritius"]) {
    const plan=orchestration.buildPlan(query,{manifest});
    assert.equal(plan.selectedTool.id,"fuel-tracker",query);
    assert.equal(plan.execution.toolId,"fuel-tracker",query);
    assert.match(plan.execution.launchUrl,/^\/tools\/fuel-tracker\//,query);
  }
  for(const query of ["generator fuel cost South Africa","10 kVA petrol generator running 4.5 hours daily in Rwanda"]) {
    const plan=orchestration.buildPlan(query,{manifest});
    assert.equal(plan.selectedTool.id,"generator-fuel",query);
    assert.match(plan.execution.launchUrl,/^\/tools\/generator-fuel\//,query);
  }
  const noFuel=orchestration.buildPlan("kerosene price Uganda",{manifest});
  assert.equal(noFuel.selectedTool.id,"tool-search");
  const salary=orchestration.buildPlan("take home pay Nigeria",{manifest});
  assert.ok(salary.decision.calibratedBy,"Non-energy calibration must still run");
} finally {globalThis.AfroConfidence=savedConfidence;globalThis.AFRO_DATA=savedData;}
const solarBill=field("INPUT","7620",[],{min:"0",max:"1000000000",step:"1"});
const solarSystem=field("SELECT","3",["1","2","3","5","10"]);
let solarEvents=0;solarBill.addEventListener("input",()=>solarEvents++);solarSystem.addEventListener("change",()=>solarEvents++);
const solarPrefill=consumer("solar-roi",{country:"Kenya",monthlyBill:8500,loadSizeKw:5},{monthlyBill:solarBill,systemKW:solarSystem});
assert.equal(solarBill.value,"8500");assert.equal(solarSystem.value,"5");assert.equal(solarEvents,2,"Actual input/change contract not quiet stale values");
solarBill.edit("9000");solarSystem.edit("2");solarPrefill.retry();assert.equal(solarBill.value,"9000");assert.equal(solarSystem.value,"2");
const validBill=field("INPUT","7620",[],{min:"0",max:"1000000000",step:"1"});consumer("solar-roi",{monthlyBill:-5},{monthlyBill:validBill});assert.equal(validBill.value,"7620");
// Exercise maintained state transitions; don't leave recovery layout on results.
const stateBlock=page.slice(page.indexOf("    function setState(name)"),page.indexOf("    function showConsentCard(show)"));
const stateNodes=Object.fromEntries(["empty","loading","result","noMatch","error","unsupportedFuel"].map(k=>[k,{hidden:true,scrollIntoView(){this.scrolled=true;}}]));
const classes=new Set();const ctx={states:stateNodes,document:{body:{classList:{toggle(k,on){on?classes.add(k):classes.delete(k);}}}},commandSection:null,resultCards:null,errorCards:null,noMatchCards:null,showConsentCard(){},window:{requestAnimationFrame:f=>f(),matchMedia:()=>({matches:true})}};
vm.runInNewContext(stateBlock+';setState("unsupportedFuel");',ctx);assert.ok(classes.has("ai-has-recovery"));assert.equal(stateNodes.unsupportedFuel.hidden,false);assert.equal(stateNodes.unsupportedFuel.scrolled,true);
vm.runInNewContext('setState("result");',ctx);assert.equal(classes.has("ai-has-recovery"),false);assert.equal(stateNodes.unsupportedFuel.hidden,true);
assert.match(page,/#aiFuelRecoveryTitle\{color:#0f172a/);
console.log("Actual browser calibration, solar reactive once-only prefill, and compact recovery state regressions passed.");
