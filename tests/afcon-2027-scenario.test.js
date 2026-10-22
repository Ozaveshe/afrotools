"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const sports = require("../assets/js/sports-toolkit.js");
const defaults = {mode:"2027-planner",favorite:"Morocco",formBoost:3,defenseBoost:2,hostBoost:1,upsetTolerance:4};
const kenya = {...defaults,favorite:"Kenya",kenyaStrength:1505,replaceSeed:"Sierra Leone"};
const calculate = values => sports.calculate("afcon-predictor",values);

test("existing Morocco and Nigeria default outcomes remain unchanged",()=>{
 assert.equal(calculate(defaults).heroValue,"8.0%");
 assert.equal(calculate({...defaults,favorite:"Nigeria"}).heroValue,"6.9%");
 assert.deepEqual(calculate({...defaults,kenyaStrength:"invalid",replaceSeed:"Uganda"}),calculate(defaults));
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
 assert.match(field.basis,/illustrative model assumption; not Kenya\/FIFA rating/);
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
test("missing or invalid strength never invents a Kenya rating or numeric forecast",()=>{
 for(const value of [undefined,"", "  ",NaN,Infinity,-1,3001,"1505junk"]){
  const r=calculate({...kenya,kenyaStrength:value});
  assert.equal(r.heroValue,"Not calculated");
  assert.equal(r.scenarioField,undefined);
  assert.equal(r.rows.length,0);
 }
});
test("host, unknown or absent replacement and 2025 Kenya fail without a fictitious field",()=>{
 for(const replaceSeed of [undefined,"","Uganda","Tanzania","Kenya","Not a seed"]){
  assert.equal(calculate({...kenya,replaceSeed}).heroValue,"Not calculated");
 }
 assert.equal(calculate({...kenya,mode:"2025-review"}).heroValue,"Not calculated");
 for(const name of ["formBoost","defenseBoost","hostBoost","upsetTolerance"]){
  for(const value of [-1,11,Infinity,"bad",""])assert.equal(calculate({...kenya,[name]:value}).heroValue,"Not calculated");
 }
});
test("CAF context is dated and model assumption stays separate from official host facts",()=>{
 const r=calculate(kenya);
 assert.equal(r.sources.length,1);
 assert.equal(r.sources[0].url,"https://www.cafonline.com/afcon2025/news/everything-you-need-to-know-about-totalenergies-caf-africa-cup-of-nations-pamoja-2027/");
 assert.match(r.sources[0].note,/17 June 2026/);
 assert.match(r.sources[0].note,/22 October 2026/);
 assert.match(r.heroSub,/what-if/);
 assert.match(r.heroSub,/not an official rating/);
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
 assert.match(r.insights.join(" "),/replacement seed fixed/);
 assert.doesNotMatch(r.insights.join(" "),/Competitor|knockout tournament/);
 const old=calculate(defaults);
 assert.equal(old.metrics.find(row=>row.label==="Field pressure").unit,"chance someone else wins");
 assert.ok(old.rows.some(([label])=>label==="Most likely final path"));
 assert.ok(old.rows.slice(0,8).every(([,value])=>value.endsWith(" title probability")));
});
