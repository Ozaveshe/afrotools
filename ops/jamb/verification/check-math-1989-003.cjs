'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1989-003-updates.json')}:require('./math-1989-publishable-003.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length,2);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);}
 if(q.num===13){
  assert.match(q.question,/\(2R \+ T\)\/\(2RT\)/);
  assert.deepEqual(Object.values(q.options),['R = T/(TS² − 1)','R = T/[2(TS² − 1)]','R = T/(TS² + 1)','R = T/[2(TS² + 1)]']);
  const options=[(s,t)=>t/(t*s*s-1),(s,t)=>t/(2*(t*s*s-1)),(s,t)=>t/(t*s*s+1),(s,t)=>t/(2*(t*s*s+1))];
  const valid=options.map(f=>[0,.5,1,2,3].every(s=>[-3,-2,-1,2,3,4].every(t=>{if(t*s*s===1)return true;const R=f(s,t);return Number.isFinite(R)&&R!==0&&Math.abs(Math.sqrt((2*R+t)/(2*R*t))-s)<1e-8;})));
  assert.deepEqual(valid.flatMap((v,i)=>v?['ABCD'[i]]:[]),[q.answer]);
  assert.match(q.explanation,/TS² ≠ 1/);
 }else if(q.num===16){
  assert.match(q.question,/2x² − 5x \+ 3/);
  assert.deepEqual(Object.values(q.options),['2x² − x','2x² − x + 10','4x² + 3x + 2','4x² + 3x + 12']);
  const options=[x=>2*x*x-x,x=>2*x*x-x+10,x=>4*x*x+3*x+2,x=>4*x*x+3*x+12];
  assert.deepEqual(options.flatMap((f,i)=>[-5,-1,0,1,4].every(x=>f(x)===2*(x+1)**2-5*(x+1)+3)?['ABCD'[i]]:[]),[q.answer]);
 }else throw Error('Unchecked record');
}
console.log(JSON.stringify({passed:true,count:2,question_ids:batch.records.map(r=>r.id)}));
