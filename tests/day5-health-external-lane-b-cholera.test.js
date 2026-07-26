'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=require('../tools/cholera-risk/cholera-urgency-engine.js');
const html=fs.readFileSync(path.join(root,'tools/cholera-risk/index.html'),'utf8');
const context=JSON.parse(fs.readFileSync(path.join(root,'data/ai/tool-context/cholera-risk.json'),'utf8'));
const base={timing:'none',drinking:'normal'};

test('inability to drink and shock signs always require emergency care',()=>{
  const unable=engine.assess({...base,drinking:'unable'});
  const shock=engine.assess({...base,collapse:true,outbreak:true});
  assert.equal(unable.level,'Emergency rehydration-capable care now');
  assert.match(unable.action,/Do not force oral fluids/);
  assert.equal(shock.level,'Emergency rehydration-capable care now');
  assert.match(shock.action,/do not delay/i);
});

test('separates urgent dehydration and bloody-stool pathways from diagnosis',()=>{
  for(const selection of [{frequent:true},{repeatedVomiting:true},{dehydration:true},{bloodyStool:true}]){
    const result=engine.assess({...base,...selection});
    assert.equal(result.level,'Urgent medical care now');
    assert.match(result.warning,/cannot diagnose cholera/i);
  }
  assert.match(engine.assess({...base,bloodyStool:true}).reasons.join(' '),/another cause/i);
});

test('higher-risk and outbreak contexts elevate acute watery diarrhoea',()=>{
  const vulnerable=engine.assess({...base,timing:'today',watery:true,vulnerable:true});
  const outbreak=engine.assess({...base,timing:'1-2',watery:true,outbreak:true});
  assert.equal(vulnerable.level,'Same-day urgent clinical assessment');
  assert.equal(outbreak.level,'Contact a health service and public-health team now');
  assert.match(outbreak.action,/same-day/);
});

test('requires timing for watery diarrhoea and never clears an empty checklist',()=>{
  assert.throws(()=>engine.assess({...base,watery:true}),/Choose when/);
  const empty=engine.assess(base);
  assert.equal(empty.level,'No cholera conclusion from this checklist');
  assert.match(empty.warning,/not reassurance/i);
});

test('page and AI context preserve emergency, privacy and no-recipe boundaries',()=>{
  assert.match(html,/Current ability to drink/);
  assert.match(html,/Blood in stool/);
  assert.match(html,/supplies no antibiotics, doses or home-mixing recipe/);
  assert.match(html,/id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.equal((html.match(/theme\.addEventListener\('click'/g)||[]).length,1);
  assert.doesNotMatch(html,/\.onclick\s*=|fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  assert.equal(context.sourceReviewDate,'2026-07-26');
  assert.match(context.staticText,/Shock signs or inability to drink safely require emergency/);
  assert.match(context.privacy,/remain in the current browser page/i);
});
