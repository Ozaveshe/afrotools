'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=require('../tools/water-intake/fluid-log-engine.js');
const html=fs.readFileSync(path.join(root,'tools/water-intake/index.html'),'utf8');
const context=JSON.parse(fs.readFileSync(path.join(root,'data/ai/tool-context/water-intake.json'),'utf8'));

test('totals itemized drinks and category subtotals without rating them',()=>{
  const result=engine.total({entries:[
    {time:'08:00',type:'water',volumeMl:500},
    {time:'10:30',type:'tea-coffee',volumeMl:250},
    {time:'13:00',type:'water',volumeMl:750},
    {time:'18:00',type:'soup',volumeMl:300}
  ]});
  assert.equal(result.totalMl,1800);
  assert.equal(result.entryCount,4);
  assert.deepEqual(result.byType.map(item=>[item.type,item.volumeMl]),[['water',1250],['tea-coffee',250],['soup',300]]);
  assert.equal(result.targetMl,null);
  assert.match(result.targetContext,/no target comparison/i);
});

test('requires explicit confirmation before comparing a clinician target',()=>{
  const entries=[{type:'water',volumeMl:1500}];
  assert.throws(()=>engine.total({entries,clinicalTargetMl:1800,targetConfirmed:false}),/Confirm that the optional target/);
  const result=engine.total({entries,clinicalTargetMl:1800,targetConfirmed:true});
  assert.equal(result.targetDifference,-300);
  assert.match(result.targetContext,/300 mL below/);
  assert.match(result.targetContext,/arithmetic only/i);
});

test('rejects invalid entries and implausible combined totals',()=>{
  assert.throws(()=>engine.total({entries:[]}),/at least one/);
  assert.throws(()=>engine.total({entries:[{type:'unknown',volumeMl:100}]}),/drink type/);
  assert.throws(()=>engine.total({entries:[{type:'water',volumeMl:0}]}),/between 1 and 5000/);
  assert.throws(()=>engine.total({entries:Array.from({length:5},()=>({type:'water',volumeMl:5000}))}),/cannot exceed 20,000/);
});

test('page provides an itemized local workflow and accessible result',()=>{
  assert.match(html,/Add another drink/);
  assert.match(html,/Drink \$\{number\} volume/);
  assert.match(html,/I confirm this optional target came from a qualified clinician/);
  assert.match(html,/id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.equal((html.match(/theme\.addEventListener\('click'/g)||[]).length,1);
  assert.doesNotMatch(html,/\.onclick\s*=|fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
});

test('AI context prohibits prescriptions and sensitive-data movement',()=>{
  assert.equal(context.sourceReviewDate,'2026-07-26');
  assert.match(context.staticText,/Never generate or prescribe a personal fluid target/);
  assert.match(context.staticText,/interpret above or below as an instruction/);
  assert.match(context.privacy,/remain in the current browser page/i);
});
