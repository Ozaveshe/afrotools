'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const draft=process.argv.includes('--draft'),root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const records=draft?require('./math-1992-003-candidates.json'):require('./math-1992-publishable-003.json').records;
const pool=draft?records.map(r=>r.candidate):JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
assert.deepEqual(records.map(r=>r.candidate.num),[43,44,47,48]);
for(const r of records){
 const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);assert.equal(r.source_pdf_page,33);assert.equal(r.source_pdf_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');assert.equal(q.year,1992);assert.equal(q.subject,'mathematics');assert.equal(q.explanation,q.ai_explanation);assert.deepEqual(q.verification,{method:'ai-calculation-checked',reviewed_at:'2026-09-12'});
 assert.doesNotMatch(q.question+' '+q.explanation,/repair|original key|source note|guessed/i);
 if(q.num===43){
  assert.equal(q.question,'A frequency distribution has values 2, 4, 6 and 8, with respective frequencies 4, y, 6 and 5. If its mean is 5.2, find y.');
  assert.deepEqual(q.options,{A:'6.0',B:'5.2',C:'5.0',D:'4.0'});
  assert.deepEqual(Object.entries(q.options).filter(([,v])=>Math.abs((84+4*Number(v))/(15+Number(v))-5.2)<1e-12).map(([key])=>key),[q.answer]);
 }else if(q.num===44){
  assert.equal(q.question,'The numbers of children in families are 0, 1, 2, 3, 4, 5 and 6, with respective frequencies 7, 11, 6, 7, 7, 5 and 3. Find the mode and median, respectively.');
  assert.deepEqual(q.options,{A:'2,1',B:'1,2',C:'1,5',D:'5,2'});
  const frequencies=[7,11,6,7,7,5,3],values=frequencies.flatMap((f,x)=>Array(f).fill(x));assert.equal(values.length,46);
  const mode=frequencies.indexOf(Math.max(...frequencies)),median=(values[22]+values[23])/2;
  assert.deepEqual(Object.entries(q.options).filter(([,v])=>v===mode+','+median).map(([key])=>key),[q.answer]);
 }else if(q.num===47){
  assert.equal(q.question,'Two fair six-sided dice are thrown together. Determine the probability of obtaining a total score of 8.');
  assert.deepEqual(q.options,{A:'1/12',B:'5/36',C:'1/8',D:'7/36'});
  const all=Array.from({length:36},(_,i)=>[Math.floor(i/6)+1,i%6+1]);const favourable=all.filter(([a,b])=>a+b===8).length;
  assert.deepEqual(Object.entries(q.options).filter(([,v])=>{const [a,b]=v.split('/').map(Number);return a*36===b*favourable;}).map(([key])=>key),[q.answer]);
 }else{
  assert.equal(q.question,'Events P and Q have probabilities 3/4 and 1/6, respectively. If the probability that both occur is 1/12, what is the probability that at least one occurs?');
  assert.deepEqual(q.options,{A:'1/96',B:'1/8',C:'5/6',D:'11/12'});
  // Twelve equal parts: P-only8, Q-only1, both1, neither2.
  const regions=[8,1,1,2];assert.equal(regions.reduce((a,b)=>a+b),12);assert.equal((regions[0]+regions[2])/12,3/4);assert.equal((regions[1]+regions[2])/12,1/6);
  assert.deepEqual(Object.entries(q.options).filter(([,v])=>{const [a,b]=v.split('/').map(Number);return a*12===b*10;}).map(([key])=>key),[q.answer]);
 }
}
console.log(JSON.stringify({passed:true,count:records.length,question_ids:records.map(r=>r.id)}));
