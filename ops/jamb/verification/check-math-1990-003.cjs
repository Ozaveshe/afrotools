'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1990-003-updates.json')}:require('./math-1990-publishable-003.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length,2);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);}
 if(q.num===39){
  assert.match(q.question,/cos θ = 12\/13.*1 \+ cot² θ/);assert.equal(q.answer,'A');assert.equal(q.options.A,'169/25');
  const angle=Math.acos(12/13);
  for(const a of [angle,-angle])assert.ok(Math.abs(1+1/Math.tan(a)**2-169/25)<1e-10);
 }else if(q.num===49){
  assert.match(q.question,/without replacement.*1, 2, 3 and 4/);assert.equal(q.answer,'C');assert.equal(q.options.C,'1/3');
  const pairs=[];for(let a=1;a<=4;a++)for(let b=a+1;b<=4;b++)pairs.push([a,b]);
  assert.equal(pairs.length,6);assert.deepEqual(pairs.filter(([a,b])=>(a+b)%2===0),[[1,3],[2,4]]);
 }else throw Error('Unchecked record');
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id),count:2}));
