"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const testRoot = process.env.AFROTOOLS_SPORTS_TEST_ROOT || require("node:path").resolve(__dirname, "..");
const testEngine = process.env.AFROTOOLS_SPORTS_TEST_ENGINE || require("node:path").join(testRoot, "assets/js/sports-toolkit.js");
const sports = require(testEngine);
const defaults = {fieldSetup:"seeded",mode:"2027-planner",favorite:"Morocco",formBoost:3,defenseBoost:2,hostBoost:1,upsetTolerance:4};
const kenya = {...defaults,fieldSetup:"all-hosts",favorite:"Kenya",kenyaStrength:1505,replaceSeed:"Sierra Leone"};
const calculate = values => sports.calculate("afcon-predictor",values);

test("legacy seeded Morocco and Nigeria outcomes remain unchanged",()=>{
 assert.equal(calculate(defaults).heroValue,"8.0%");
 assert.equal(calculate({...defaults,favorite:"Nigeria"}).heroValue,"6.9%");
 assert.deepEqual(calculate({...defaults,kenyaStrength:"invalid",replaceSeed:"Uganda"}),calculate(defaults));
});

test("every seeded team appears in the full ranking and the comparison bars",()=>{
 for(const favorite of sports.tools["afcon-predictor"].fields.find(field=>field.id==="favorite").options.map(option=>option.value)){
  for(const mode of ["2027-planner","2025-review"]){
   const r=calculate({...defaults,favorite,mode}),rankings=r.rows.filter(([label])=>/^\d+\. /.test(label));
   assert.equal(rankings.length,24);
   assert.equal(new Set(rankings.map(([label])=>label.replace(/^\d+\. /,"").replace(/ \(selected\)$/, ""))).size,24);
   assert.ok(rankings.some(([label])=>label.endsWith(favorite+" (selected)")));
   assert.ok(r.bars.some(bar=>bar.label===favorite+" (selected)"));
   assert.equal(r.scenarioField.names[r.comparison.selectedRank-1],favorite);
   assert.ok(Math.abs(r.scenarioField.shares.reduce((a,b)=>a+b,0)-100)<1e-9);
   assert.doesNotMatch(JSON.stringify(r),/title probability|chance someone else wins|Most likely final path/);
  }
 }
});

test("zero boosts show no invented improvement and preserve the baseline rank",()=>{
 for(const favorite of ["Morocco","Sierra Leone","Kenya"]){
  const r=calculate({...kenya,favorite,replaceSeed:favorite==="Sierra Leone"?"Angola":"Sierra Leone",formBoost:0,defenseBoost:0,hostBoost:0});
  assert.equal(r.comparison.deltaPoints,0);
  assert.equal(r.comparison.selectedRank,r.comparison.baselineRank);
  assert.equal(r.comparison.selectedShare,r.comparison.baselineShare);
 }
});

test("boost impact agrees with an independent weight-ratio calculation for the same field",()=>{
 for(const scenario of [defaults,{...defaults,favorite:"Sierra Leone"},kenya,{...defaults,mode:"2025-review"}]){
  const base=calculate({...scenario,formBoost:0,defenseBoost:0,hostBoost:0});
  const boosted=calculate({...scenario,formBoost:3.5,defenseBoost:2.5,hostBoost:1.5});
  const share=base.comparison.selectedShare/100;
  const points=3.5*8+2.5*5+1.5*10;
  const multiplier=Math.exp(points/(330+28*scenario.upsetTolerance));
  const expected=100*share*multiplier/(1-share+share*multiplier);
  assert.ok(Math.abs(boosted.comparison.selectedShare-expected)<1e-10);
  assert.ok(Math.abs(boosted.comparison.deltaPoints-(expected-share*100))<1e-10);
  assert.equal(boosted.comparison.boostPoints,points);
  assert.ok(boosted.comparison.selectedRank<=boosted.comparison.baselineRank);
  assert.match(boosted.rows.find(([label])=>label==="Boost calculation")[1],/3\.5 × 8.*2\.5 × 5.*1\.5 × 10 host = 55\.5/);
 }
});

test("comparison measures the leader gap, or runner-up lead when selected team is first",()=>{
 for(const favorite of ["Morocco","Sierra Leone"]){
  const r=calculate({...defaults,favorite}),f=r.scenarioField;
  const rivalIndex=r.comparison.selectedRank===1?1:0;
  assert.equal(r.comparison.rival,f.names[rivalIndex]);
  assert.ok(Math.abs(r.comparison.gapPoints-Math.abs(r.comparison.selectedShare-f.shares[rivalIndex]))<1e-10);
 }
});

test("all teams receive validated controls and the source for their selected tournament",()=>{
 for(const name of ["formBoost","defenseBoost","hostBoost","upsetTolerance"]){
  for(const value of [-1,11,Infinity,"3bad",""])assert.equal(calculate({...defaults,[name]:value}).heroValue,"Not calculated");
 }
 assert.equal(calculate({...defaults,favorite:"Not a team"}).heroValue,"Not calculated");
 assert.equal(calculate({...defaults,mode:"2030"}).heroValue,"Not calculated");
 assert.match(calculate(defaults).sources[0].url,/pamoja-2027/);
 assert.doesNotMatch(JSON.stringify(calculate({...defaults,mode:"2025-review"}).sources),/pamoja|appeal/);
});
test("explicit Kenya assumption replaces one non-host and keeps 24 unique teams including all co-hosts",()=>{
 const result=calculate(kenya),field=result.scenarioField;
 assert.ok(field);
 assert.equal(field.names.length,24);
 assert.equal(new Set(field.names).size,24);
 for(const name of ["Kenya","Uganda","Tanzania"])assert.ok(field.names.includes(name));
 assert.ok(!field.names.includes("Sierra Leone"));
 assert.equal(field.strength,1505);
 assert.equal(field.replaced,"Sierra Leone");
 assert.match(field.basis,/illustrative model assumption.*not Kenya\/FIFA rating/i);
 assert.ok(result.rows.some(([name,value])=>name==="Kenya strength assumption" && value.includes("1505")));
 assert.ok(result.rows.some(([name,value])=>name==="What-if field change" && value.includes("Sierra Leone")));
});
test("Kenya model shares normalize and selected rank agrees with the actual field",()=>{
 const r=calculate(kenya),f=r.scenarioField;
 assert.ok(f.shares.every(value=>Number.isFinite(value)&&value>=0&&value<=100));
 assert.ok(Math.abs(f.shares.reduce((sum,value)=>sum+value,0)-100)<1e-9);
 const position=f.names.indexOf("Kenya");
 assert.equal(r.metrics.find(row=>row.label==="Favorite rank").value,String(position+1));
 assert.equal(r.metrics.find(row=>row.label==="Field pressure").value,(100-f.shares[position]).toFixed(1)+"%");
});
test("stronger explicit Kenya strength cannot reduce its model share",()=>{
 const share=strength=>{const f=calculate({...kenya,kenyaStrength:strength}).scenarioField;return f.shares[f.names.indexOf("Kenya")];};
 let previous=-1;
 for(const strength of [0,1000,1480,1505,1885,2500,3000]){const next=share(strength);assert.ok(next>previous);previous=next;}
});
test("blank or invalid explicit strength returns a correction",()=>{
 for(const value of ["", "  ",NaN,Infinity,-1,3001,"1505junk"]){
  const r=calculate({...kenya,kenyaStrength:value});
  assert.equal(r.heroValue,"Not calculated");
  assert.equal(r.scenarioField,undefined);
  assert.equal(r.rows.length,0);
 }
});
test("host, unknown or blank replacement and 2025 Kenya fail without a fictitious field",()=>{
 for(const replaceSeed of ["","Uganda","Tanzania","Kenya","Not a seed"]){
  assert.equal(calculate({...kenya,replaceSeed}).heroValue,"Not calculated");
 }
 assert.equal(calculate({...kenya,mode:"2025-review"}).heroValue,"Not calculated");
 for(const name of ["formBoost","defenseBoost","hostBoost","upsetTolerance"]){
  for(const value of [-1,11,Infinity,"bad",""])assert.equal(calculate({...kenya,[name]:value}).heroValue,"Not calculated");
 }
});

test("English default controls select all three hosts with visible starting assumptions",()=>{
 const h=browserHarness();
 const input=Object.fromEntries(Array.from(h.config.fields,field=>[field.id,field.value]));
 const r=calculate(input),f=r.scenarioField;
 assert.equal(f.setup,"all-hosts");
 assert.equal(f.strength,1505);
 assert.equal(f.replaced,"Sierra Leone");
 assert.equal(f.members.length,24);
 for(const host of ["Kenya","Uganda","Tanzania"])assert.ok(f.members.includes(host));
 assert.ok(!f.members.includes("Sierra Leone"));
 assert.match(r.rows.find(([name])=>name==="Kenya strength assumption")[1],/default 1505 equals Uganda model seed/);
 assert.match(r.rows.find(([name])=>name==="What-if field change")[1],/Kenya replaces Sierra Leone/);
 assert.match(f.basis,/Hosts verified; other seeds are not confirmed qualifiers/);
});

for(const locale of ["fr","sw"]){
 test(locale+" actual maintained input reader keeps Sierra Leone and all listed teams calculable without field controls",()=>{
  const fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
  const localeRoot=process.env.AFROTOOLS_SPORTS_LOCALE_ROOT||testRoot;
  const source=fs.readFileSync(path.join(localeRoot,"assets/js/pages/"+locale+"-sports-parity.js"),"utf8");
  const config=sports.tools["afcon-predictor"],form={elements:{}};
  for(const field of config.fields)form.elements[field.id]={value:String(field.value),setAttribute(){},removeAttribute(){}};
  assert.ok(!form.elements.fieldSetup&&!form.elements.kenyaStrength&&!form.elements.replaceSeed);
  const fragment=locale==="fr"
   ?source.slice(source.indexOf("function readInputs("),source.indexOf("function fieldHtml("))
   :source.slice(source.indexOf("function inputs()"),source.indexOf("function validate("));
  assert.ok(fragment.startsWith("function "));
  assert.match(source,locale==="fr"?/engine\.calculate\(page, read\.input\)/:/engine\.calculate\(page\.toolId, input\)/);
  const read=()=>vm.runInNewContext(fragment+(locale==="fr"?";readInputs(form,config)":";({input:inputs(),error:''})"),{form,config,tool:config,FIELD_LABELS:{}});
  const listed=config.fields.find(f=>f.id==="favorite").options.map(o=>o.value);
  for(const favorite of ["Sierra Leone",...listed.filter(name=>name!=="Sierra Leone")]){
   form.elements.favorite.value=favorite;
   const parsed=read();assert.equal(parsed.error,"");assert.equal(parsed.input.fieldSetup,undefined);
   const r=calculate(parsed.input);
   assert.notEqual(r.heroValue,"Not calculated",locale+" "+favorite);
   assert.equal(r.scenarioField.names.length,24);
   assert.ok(r.scenarioField.names.includes(favorite));
   assert.ok(!r.scenarioField.names.includes("Kenya"));
   if(favorite==="Sierra Leone"){assert.equal(r.heroValue,"2.7%");assert.equal(r.comparison.selectedRank,20);}
  }
 });
}

test("legacy Kenya callers still need explicit strength and replacement while new field controls have named defaults",()=>{
 const legacy={...kenya};delete legacy.fieldSetup;
 assert.equal(calculate(legacy).heroValue,"3.4%");
 for(const key of ["kenyaStrength","replaceSeed"]){const invalid={...legacy};delete invalid[key];assert.equal(calculate(invalid).heroValue,"Not calculated");}
 const explicit=calculate({mode:"2027-planner",favorite:"Kenya",fieldSetup:"all-hosts"});
 assert.equal(explicit.scenarioField.strength,1505);
 assert.equal(explicit.scenarioField.replaced,"Sierra Leone");
});

test("switching selected team never changes field members or unboosted shares",()=>{
 const setup={...kenya,formBoost:0,defenseBoost:0,hostBoost:0};
 const original=calculate(setup).scenarioField;
 for(const favorite of original.members){
  const r=calculate({...setup,favorite});
  assert.deepEqual(r.scenarioField.members,original.members);
  assert.deepEqual(r.scenarioField.names,original.names);
  assert.deepEqual(r.scenarioField.shares,original.shares);
  assert.ok(r.bars.some(bar=>bar.label===favorite+" (selected)"));
  assert.equal(r.comparison.deltaPoints,0);
 }
});

test("switching away from Kenya retains custom Kenya strength and the chosen replacement",()=>{
 const setup={...kenya,kenyaStrength:1632.5,replaceSeed:"Ghana"};
 for(const favorite of ["Kenya","Morocco","Tanzania","Uganda","Sierra Leone"]){
  const r=calculate({...setup,favorite}),f=r.scenarioField;
  assert.equal(f.strength,1632.5);assert.equal(f.replaced,"Ghana");
  assert.ok(f.members.includes("Kenya"));assert.ok(!f.members.includes("Ghana"));
  assert.equal(r.rows.filter(([label])=>/^\d+\. /.test(label)).length,24);
 }
});

test("removed team requires an explicit different replacement; selected team cannot be removed",()=>{
 const rejected=calculate({...kenya,favorite:"Sierra Leone"});
 assert.equal(rejected.heroValue,"Not calculated");
 assert.match(rejected.heroSub,/Choose a different replacement above/);
 assert.equal(rejected.scenarioField,undefined);
 const accepted=calculate({...kenya,favorite:"Sierra Leone",replaceSeed:"Angola"});
 assert.ok(accepted.scenarioField.members.includes("Sierra Leone"));
 assert.ok(accepted.scenarioField.members.includes("Kenya"));
 assert.ok(!accepted.scenarioField.members.includes("Angola"));
 assert.equal(calculate({...kenya,favorite:"Morocco",replaceSeed:"Morocco"}).heroValue,"Not calculated");
 assert.equal(calculate({...kenya,fieldSetup:"seeded"}).heroValue,"Not calculated");
 assert.equal(calculate({...kenya,fieldSetup:"unknown"}).heroValue,"Not calculated");
});

test("all-host strength and boost boundaries remain finite and normalize to 100",()=>{
 for(const kenyaStrength of [0,1505,3000])for(const upsetTolerance of [0,10])for(const favorite of ["Kenya","Morocco","Tanzania"]){
  const r=calculate({...kenya,favorite,kenyaStrength,upsetTolerance,formBoost:10,defenseBoost:10,hostBoost:10});
  assert.ok(r.scenarioField.shares.every(Number.isFinite));
  assert.ok(Math.abs(r.scenarioField.shares.reduce((a,b)=>a+b,0)-100)<1e-9);
  assert.ok(Object.values(r.comparison).filter(x=>typeof x==="number").every(Number.isFinite));
 }
});

function browserHarness(){
 const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path");
 const body={classList:{add(){},remove(){}},appendChild(link){link.parentNode=body;}};
 const events={downloads:[],blobs:[],prints:0,fetches:0};
 const window={document:{documentElement:{lang:"en"},body,createElement(){return {click(){events.downloads.push({href:this.href,name:this.download});},remove(){this.parentNode=null;}};}},location:{pathname:"/tools/afcon-predictor/"},Blob,
  URL:{createObjectURL(blob){events.blobs.push(blob);return "blob:synthetic-local-report";},revokeObjectURL(){}},
  print(){events.prints++;},fetch(){events.fetches++;return Promise.resolve({});},setTimeout(fn){fn();},localStorage:{getItem(){return null;},setItem(){}}};
 const source=fs.readFileSync(testEngine,"utf8");
 const hook='e.__afconTest={prepare:prepareAfconKenyaFields,sync:typeof syncAfconFieldControls==="function"?syncAfconFieldControls:null,report:R,markup:typeof afconReportMarkup==="function"?afconReportMarkup:null,bind:L};e.AfroSports=q,';
 assert.ok(source.includes("e.AfroSports=q,"));
 vm.runInNewContext(source.replace("e.AfroSports=q,",hook),{window,console,Blob});
 const config=window.AfroSports.tools["afcon-predictor"];
 window.__afconTest.prepare("afcon-predictor",config);
 return {window,events,config,api:window.__afconTest};
}

test("field controls appear before team selection and do not rewrite values on team or mode changes",()=>{
 const h=browserHarness(),fields=h.config.fields;
 assert.deepEqual(Array.from(fields.slice(0,5),f=>f.id),["mode","fieldSetup","kenyaStrength","replaceSeed","favorite"]);
 const form={elements:{}};
 for(const field of fields){
  const holder={hidden:false,style:{}};
  form.elements[field.id]={value:String(field.value),options:(field.options||[]).map(o=>({value:o.value,disabled:false})),closest(){return holder;}};
 }
 h.api.sync("afcon-predictor",h.config,form);
 assert.equal(form.elements.kenyaStrength.value,"1505");
 assert.equal(form.elements.replaceSeed.value,"Sierra Leone");
 assert.equal(form.elements.favorite.options.find(o=>o.value==="Sierra Leone").disabled,true);
 form.elements.favorite.value="Kenya";h.api.sync("afcon-predictor",h.config,form);
 form.elements.favorite.value="Nigeria";h.api.sync("afcon-predictor",h.config,form);
 assert.equal(form.elements.replaceSeed.value,"Sierra Leone");
 assert.equal(form.elements.kenyaStrength.value,"1505");
 assert.equal(form.elements.replaceSeed.options.find(o=>o.value==="Nigeria").disabled,true);
 form.elements.mode.value="2025-review";h.api.sync("afcon-predictor",h.config,form);
 assert.equal(form.elements.kenyaStrength.disabled,true);
 form.elements.mode.value="2027-planner";h.api.sync("afcon-predictor",h.config,form);
 assert.equal(form.elements.kenyaStrength.disabled,false);
 assert.equal(form.elements.kenyaStrength.value,"1505");
 assert.equal(form.elements.replaceSeed.value,"Sierra Leone");
});

test("AFCON printable report contains all rankings and chosen field assumptions without an email form",()=>{
 const h=browserHarness(),input={...kenya,favorite:"Morocco",kenyaStrength:1632.5,replaceSeed:"Ghana"};
 const r=h.window.AfroSports.calculate("afcon-predictor",input),report=h.api.report("afcon-predictor",h.config,r,input);
 assert.equal(report.split("\n").filter(line=>/^- \d+\. /.test(line)).length,24);
 for(const text of ["Morocco (selected)","1632.5","Kenya replaces Ghana","2027 scenario field: all-hosts","Non-host seed replaced by Kenya: Ghana"])assert.ok(report.includes(text),text);
 const markup=h.api.markup(report);
 assert.doesNotMatch(markup,/<form|name="email"|Unlock|capture-lead|sports-report-actions" hidden/);
 assert.match(markup,/data-print-report/);assert.match(markup,/data-download-afcon-report/);
 assert.match(markup,/sports-report-preview on/);
});

test("actual AFCON handlers download full TXT and trigger local print without a lead submission",async()=>{
 const h=browserHarness(),input={...kenya,favorite:"Morocco"},r=h.window.AfroSports.calculate("afcon-predictor",input);
 const handlers={},pre={},message={};
 const makeButton=key=>({addEventListener(event,fn){handlers[key]=fn;}});
 const container={classList:{add(){},remove(){}},querySelector(selector){return ({form:null,".sports-report-actions":{},"[data-report-preview]":pre,".sports-lead-msg":message,"[data-print-report]":makeButton("print"),"[data-download-afcon-report]":makeButton("download"),"[data-save-report]":null})[selector]||null;}};
 h.api.bind({querySelector(){return container;}},"afcon-predictor",h.config,r,input);
 handlers.download();handlers.print();
 assert.equal(h.events.prints,1);assert.equal(h.events.fetches,0);
 assert.equal(h.events.downloads[0].name,"afcon-scenario-report.txt");
 assert.equal(await h.events.blobs[0].text(),pre.textContent);
 assert.equal(pre.textContent.split("\n").filter(line=>/^- \d+\. /.test(line)).length,24);
 assert.match(pre.textContent,/Kenya replaces Sierra Leone/);
});

test("actual generated AFCON page scopes print to the untruncated report and leaves other sports templates alone",()=>{
 const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),pages={};
 const source=fs.readFileSync(path.join(testRoot,"scripts/build-sports-tool-pages.js"),"utf8");
 vm.runInNewContext(source,{require:name=>name==="fs"?{mkdirSync(){},writeFileSync(file,html){pages[file.replaceAll("\\","/").split("/tools/")[1]]=html;}}:require(name),__dirname:"/virtual/scripts",console:{log(){}}});
 const afcon=pages["afcon-predictor/index.html"];
 assert.match(afcon,/@media print/);
 assert.match(afcon,/#sports-results > :not\(\.sports-report-gate\)/);
 assert.match(afcon,/\.sports-report-gate > :not\(\.sports-report-preview\)\{display:none!important\}/);
 assert.match(afcon,/\.sports-report-preview\{display:block!important;max-height:none!important;overflow:visible!important;white-space:pre-wrap/);
 for(const [name,html] of Object.entries(pages))if(name!=="afcon-predictor/index.html")assert.doesNotMatch(html,/@media print/);
 assert.equal(Object.keys(pages).length,15);
});
test("CAF context is dated and model assumption stays separate from official host facts",()=>{
 const r=calculate(kenya);
 assert.equal(r.sources.length,1);
 assert.equal(r.sources[0].url,"https://www.cafonline.com/afcon2025/news/everything-you-need-to-know-about-totalenergies-caf-africa-cup-of-nations-pamoja-2027/");
 assert.match(r.sources[0].note,/17 June 2026/);
 assert.match(r.sources[0].note,/7 November 2026/);
 assert.match(r.heroSub,/what-if/);
 assert.match(r.scenarioField.basis,/not Kenya\/FIFA rating/);
 assert.ok(r.rows.some(([name,value])=>name==="CAF announced dates"&&value.includes("19 June–17 July 2027")));
});
test("Kenya scenarios never mutate original seeded outcomes",()=>{
 const before=calculate(defaults);
 for(const replaceSeed of ["Morocco","Nigeria","Sierra Leone"])calculate({...kenya,replaceSeed});
 assert.deepEqual(calculate(defaults),before);
 assert.equal(sports.tools["afcon-predictor"].fields.find(field=>field.id==="favorite").options.length,24,"pure API does not alter original config without English UI init");
});

test("Kenya wording describes relative model shares without predicting a draw or calibrated outcome",()=>{
 const r=calculate(kenya);
 assert.ok(r.rows.slice(0,8).every(([,value])=>value.endsWith(" model share")));
 assert.equal(r.metrics.find(row=>row.label==="Field pressure").unit,"share assigned to other teams");
 assert.ok(r.rows.some(([label])=>label==="Top two scenario teams"));
 assert.ok(!r.rows.some(([label,value])=>/Most likely final path|title probability/.test(label+value)));
 assert.match(r.insights.join(" "),/not calibrated chances or a simulated bracket/);
 assert.match(r.insights.join(" "),/replacement seed fixed|field stays fixed/);
 assert.doesNotMatch(r.insights.join(" "),/Competitor|knockout tournament/);
 const old=calculate(defaults);
 assert.equal(old.metrics.find(row=>row.label==="Field pressure").unit,"share assigned to other teams");
 assert.ok(!old.rows.some(([label])=>label==="Most likely final path"));
 assert.ok(old.rows.slice(0,8).every(([,value])=>value.endsWith(" model share")));
});

function localeAfcon(locale) {
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const source=fs.readFileSync(path.join(testRoot,'assets/js/pages/'+locale+'-sports-parity.js'),'utf8');
 const start=source.indexOf('  // AFCON-only copy and result presentation.'),end=source.indexOf('  function esc(value)',start);
 assert.ok(start>=0&&end>start);
 const countries=locale==='fr'?source.slice(source.indexOf('  var COUNTRIES ='),source.indexOf('  var RESULT_LABELS =')):'';
 const box={};vm.runInNewContext(countries+source.slice(start,end)+';this.present=afconResult;this.copy=AFCON_COPY;',box);
 return {source,present:box.present,copy:box.copy};
}

for(const locale of ['fr','sw'])test(locale+' AFCON uses all-host controls and preserves field while selecting teams',()=>{
 const {source}=localeAfcon(locale);
 assert.match(source,/engine\.prepareAfconFields\(page(?:\.toolId)?, (?:config|tool)\)/);
 assert.match(source,/engine\.syncAfconFieldControls\(page(?:\.toolId)?, (?:config|tool), form\)/);
 const config=structuredClone({...sports.tools['afcon-predictor'],calculate:undefined});
 sports.prepareAfconFields('afcon-predictor',config);
 const values=Object.fromEntries(config.fields.map(f=>[f.id,f.value]));
 assert.equal(values.fieldSetup,'all-hosts');assert.equal(values.kenyaStrength,1505);assert.equal(values.replaceSeed,'Sierra Leone');
 let members;
 for(const favorite of ['Morocco','Kenya','Nigeria']){
  const result=calculate({...values,favorite});assert.ok(result.scenarioField);
  assert.equal(result.scenarioField.members.length,24);
  for(const host of ['Kenya','Uganda','Tanzania'])assert.ok(result.scenarioField.members.includes(host));
  if(members)assert.deepEqual(result.scenarioField.members,members);else members=result.scenarioField.members;
 }
 const removed=calculate({...values,favorite:'Sierra Leone'});assert.equal(removed.heroValue,'Not calculated');
 const restored=calculate({...values,favorite:'Sierra Leone',replaceSeed:'Gambia'});assert.ok(restored.scenarioField.members.includes('Sierra Leone'));
});

for(const locale of ['fr','sw'])test(locale+' full24, selected team, field assumptions and boost comparison localize coherently',()=>{
 const {present,copy}=localeAfcon(locale);
 for(const input of [{...kenya,favorite:'Morocco'},{...kenya,favorite:'Sierra Leone',replaceSeed:'Gambia',kenyaStrength:1632.5},{...defaults,mode:'2025-review',favorite:'Nigeria'}]){
  const raw=calculate(input),local=present(input,raw);
  assert.equal(local.heroValue,raw.heroValue);
  assert.equal(local.rows.filter(row=>/^\d+\. /.test(row[0])).length,24);
  assert.ok(local.rows.some(row=>row[0].endsWith(copy.selected)));
  assert.equal(local.metrics[1].value,'+'+raw.comparison.deltaPoints.toFixed(2)+' pp');
  assert.ok(local.rows.some(row=>row[0]===copy.row[3]&&row[1].includes(String(raw.comparison.boostPoints))));
  const displayed=JSON.stringify({hero:local.heroLabel,sub:local.heroSub,metrics:local.metrics,rows:local.rows,bars:local.bars,insights:local.insights});
  assert.doesNotMatch(displayed,/Your boost|Team comparison|among 24 scenario|\(selected\)|model share|model points|higher spreads|Choose the all|what-if|Scenario field|replaces | rank /);
  if(input.fieldSetup==='all-hosts'){
   assert.ok(displayed.includes(String(input.kenyaStrength)));
   assert.ok(displayed.includes(input.replaceSeed==='Gambia'&&locale==='fr'?'Gambie':input.replaceSeed));
   assert.ok(local.rows.some(row=>row[0]===copy.row[9]&&row[1]===copy.allField));
  }
 }
 const invalid=present({...kenya,favorite:'Sierra Leone'},calculate({...kenya,favorite:'Sierra Leone'}));
 assert.equal(invalid.heroValue,copy.errorValue);assert.equal(invalid.heroSub,copy.error);
});

test('localized AFCON source context separates verified 2027 hosts from assumed strengths and seeds',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const manifest=JSON.parse(fs.readFileSync(path.join(testRoot,'data/sports/source-assumption-manifest.json'))).tools['afcon-predictor'];
 const copy=JSON.parse(fs.readFileSync(path.join(testRoot,'data/sports/sw-source-assumption-copy.json'))).tools['afcon-predictor'];
 assert.equal(manifest.reviewedAt,'2026-11-07');assert.equal(manifest.state,'static-scenario');
 assert.match(manifest.sources[0].url,/pamoja-2027/);assert.equal(manifest.sources.length,copy.sources.length);
 for(const value of [manifest,copy]){
  assert.match(JSON.stringify(value),/1505/);assert.match(JSON.stringify(value),/Sierra Leone/);assert.match(JSON.stringify(value),/21/);
 }
});

function localeReportHarness(locale) {
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
 const source=fs.readFileSync(path.join(testRoot,'assets/js/pages/'+locale+'-sports-parity.js'),'utf8');
 const config=structuredClone({...sports.tools['afcon-predictor'],calculate:undefined});sports.prepareAfconFields('afcon-predictor',config);
 const window={AfroSports:{tools:{'afcon-predictor':config},prepareAfconFields:sports.prepareAfconFields},AFRO_FR_SPORTS_CONTRACTS:{}};
 const document={getElementById(id){return id==='sw-tool-config'?{textContent:JSON.stringify({toolId:'afcon-predictor',name:'AFCON',swSlug:'utabiri-wa-afcon'})}:{};}};
 const box={window,document};
 const end=source.indexOf(locale==='fr'?'  function init() {':"  mount.innerHTML = '<form class=\"sw-sports-form\"");assert.ok(end>0);
 vm.runInNewContext(source.slice(0,end)+'window.testApi={report:reportText,field:fieldHtml,present:afconResult};})(window,document);',box);
 return {...window.testApi,config};
}

for(const locale of ['fr','sw'])test(locale+' actual report and field renderers preserve all24, assumptions, and localized input labels',()=>{
 const h=localeReportHarness(locale),input={...kenya,favorite:'Sierra Leone',replaceSeed:'Gambia',kenyaStrength:1632.5},r=h.present(input,calculate(input));
 const contract={id:'afcon-predictor',title:'CAN',frSlug:'predicteur-can',resultLabel:'Part du modèle',resultSummary:'Comparaison',safety:'Hypothèses'};
 const report=locale==='fr'?h.report(contract,h.config,input,r):h.report(input,r);
 assert.equal(report.split('\n').filter(line=>/^- \d+\. /.test(line)).length,24);
 assert.ok(report.includes('1632.5'));assert.ok(report.includes('Sierra Leone'));
 assert.match(report,locale==='fr'?/Gambie/:/Gambia/);
 assert.doesNotMatch(report,/Your boost|model share|Scenario field|Non-host seed|Kenya model strength|Choose the all|\(selected\)/);
 const html=h.config.fields.map(h.field).join('');
 for(const id of ['fieldSetup','kenyaStrength','replaceSeed'])assert.match(html,new RegExp('name="'+id+'"'));
 assert.doesNotMatch(html,/All three hosts|Legacy seeded|Starting assumption|Non-host seed/);
 assert.match(html,/1505/);
});

for(const locale of ['fr','sw'])test(locale+' AFCON country names agree between selectors, rankings and report',()=>{
 const h=localeReportHarness(locale),input={...kenya,favorite:'Morocco'},r=h.present(input,calculate(input));
 const fields=h.config.fields.filter(f=>['favorite','replaceSeed'].includes(f.id)).map(h.field).join('');
 const rows=r.rows.map(row=>row.join(' ')).join('\n');
 const names=locale==='fr'?['Sénégal','RD Congo','Guinée','Mauritanie','Namibie','Guinée-Bissau','Guinée équatoriale']:['Aljeria','Kamerun','Jamhuri ya Kidemokrasia ya Kongo','Guinea ya Ikweta'];
 for(const name of names){assert.ok(fields.includes('>'+name+'</option>'),name+' selector');assert.ok(rows.includes(name),name+' ranking');}
 const report=locale==='fr'?h.report({id:'afcon-predictor',title:'CAN',frSlug:'predicteur-can',resultLabel:'Part',resultSummary:'Modèle',safety:'Hypothèses'},h.config,input,r):h.report(input,r);
 for(const name of names)assert.ok(report.includes(name),name+' report');
 assert.doesNotMatch(rows,locale==='fr'?/\bMauritania\b|\bNamibia\b|\bDR Congo\b|\bEquatorial Guinea\b/:/\bAlgeria\b|\bCameroon\b|\bDR Congo\b|\bEquatorial Guinea\b/);
});
