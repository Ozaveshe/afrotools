'use strict';

const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const engine=require('../tools/malaria-risk/malaria-urgency-engine.js');
const html=fs.readFileSync(path.join(root,'tools/malaria-risk/index.html'),'utf8');
const context=JSON.parse(fs.readFileSync(path.join(root,'data/ai/tool-context/malaria-risk.json'),'utf8'));
const base={exposure:'unknown',testStatus:'none',symptomTiming:'none'};

test('emergency signs outrank exposure and negative-test selections',()=>{
  const result=engine.assess({...base,exposure:'no',testStatus:'negative',symptomTiming:'today',unableFluids:true});
  assert.equal(result.level,'Emergency care now');
  assert.match(result.action,/Do not delay/);
  assert.match(result.warning,/even after a negative or pending test/);
});

test('routes positive, pending and negative results without interpreting treatment',()=>{
  const positive=engine.assess({...base,testStatus:'positive'});
  const pending=engine.assess({...base,testStatus:'pending',symptomTiming:'1-2',fever:true});
  const negative=engine.assess({...base,testStatus:'negative',symptomTiming:'3plus',headache:true,worsening:true});
  assert.equal(positive.level,'Qualified malaria care today');
  assert.match(positive.action,/Do not choose or change antimalarial medicine or dose/);
  assert.equal(pending.level,'Same-day clinical reassessment');
  assert.equal(negative.level,'Same-day clinical reassessment');
  assert.match(negative.action,/other causes/);
});

test('higher-risk context promotes compatible symptoms to same-day testing',()=>{
  const result=engine.assess({...base,exposure:'no',symptomTiming:'today',fever:true,higherRisk:true});
  assert.equal(result.level,'Prompt same-day malaria testing');
  assert.match(result.action,/parasite-based malaria testing/);
});

test('requires symptom timing and never turns no symptoms into clearance',()=>{
  assert.throws(()=>engine.assess({...base,fever:true}),/Choose when the current symptoms started/);
  const exposed=engine.assess({...base,exposure:'yes'});
  const quiet=engine.assess({...base,exposure:'no'});
  assert.equal(exposed.level,'No symptom-based malaria conclusion');
  assert.match(exposed.warning,/not proof/);
  assert.equal(quiet.level,'No malaria conclusion from this checklist');
  assert.match(quiet.warning,/not reassurance/);
});

test('page and AI context preserve urgent, private, non-treatment behavior',()=>{
  assert.match(html,/Most recent malaria test for these symptoms/);
  assert.match(html,/Unable to keep fluids down/);
  assert.match(html,/id="resultPanel"[\s\S]*tabindex="-1"/);
  assert.equal((html.match(/theme\.addEventListener\('click'/g)||[]).length,1);
  assert.doesNotMatch(html,/\.onclick\s*=|fetch\s*\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage/);
  assert.equal(context.sourceReviewDate,'2026-07-26');
  assert.match(context.staticText,/Emergency signs[\s\S]*outrank every test or exposure selection/);
  assert.match(context.privacy,/remain in the current browser page/i);
});
