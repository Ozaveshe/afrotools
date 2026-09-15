'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1983-publishable-901.json');
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
for(const record of batch.records){
 const q=pool.find(q=>q.id===record.id);assert.equal(questionFingerprint(q),record.content_sha256);
 let expected,values;
 if(q.num===7){
  // Independent similar-triangle/Pythagorean calculation: short leg 4,
  // shared leg squared 64-16=48, isosceles second hypotenuse squared 96.
  expected=Math.sqrt(2*(8**2-4**2));
  values=[2*Math.sqrt(3),4*Math.sqrt(6),2*Math.sqrt(6),8*Math.sqrt(6),8];
  assert.match(q.question,/QPR = 90°/);assert.match(q.question,/PRS = 90°/);
  assert.match(q.ai_explanation,/4√6 cm/);
 }else if(q.num===45){
  const diameter=7;expected=diameter*2+(22/7)*diameter/2;
  values=Object.values(q.options).map(s=>Number.parseFloat(s));
  assert.match(q.question,/opposite side/);assert.match(q.ai_explanation,/25 cm/);
 }else throw Error('Unexpected record');
 const matches=values.map((v,i)=>Math.abs(v-expected)<1e-10?String.fromCharCode(65+i):null).filter(Boolean);
 assert.deepEqual(matches,[q.answer]);assert.equal(assessQuestion(q,ledger).state,'eligible');
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id)}));
