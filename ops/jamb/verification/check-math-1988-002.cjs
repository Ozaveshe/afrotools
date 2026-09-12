'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1988-002-updates.json')}:require('./math-1988-publishable-002.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const close=(a,b)=>Math.abs(a-b)<1e-9;
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);}
 let valid;
 if(q.num===13){
  const choices={'(a + b)/(a − b)':(a,b)=>(a+b)/(a-b),'1/(a² − b²)':(a,b)=>1/(a*a-b*b),'(a − b)/(a + b)':(a,b)=>(a-b)/(a+b),'a² − b²':(a,b)=>a*a-b*b};
  valid=([,v])=>{assert.ok(choices[v]);return [-4,-2,0,1,3,5].every(a=>[-3,-1,0,2,4].every(b=>{if(a===b||a===-b)return true;const invp=(a*a+2*a*b+b*b)/(a-b),invq=(a+b)/(a*a-2*a*b+b*b);return close(invq/invp,choices[v](a,b));}));};
 }else if(q.num===16){
  const g=y=>(y-3)/11+11/(y*y-9),choices={'y/11 + 11/[y(y + 6)]':y=>y/11+11/(y*(y+6)),'y/11 + 11/[y(y + 3)]':y=>y/11+11/(y*(y+3)),'(y + 30)/11 + 11/[y(y + 3)]':y=>(y+30)/11+11/(y*(y+3)),'(y + 3)/11 + 11/[y(y − 6)]':y=>(y+3)/11+11/(y*(y-6))};
  valid=([,v])=>{assert.ok(choices[v]);return [-10,-7,-5,-4,-2,-1,1,2,4,5,7,10].every(y=>close(g(y+3),choices[v](y)));};
 }else{
  assert.equal(q.num,23);const choices={'(x + 3)/[(x + 1)(x + 2)]':x=>(x+3)/((x+1)*(x+2)),'1/[(x + 1)(x + 2)(x + 3)]':x=>1/((x+1)*(x+2)*(x+3)),'2/[(x + 1)(x + 3)]':x=>2/((x+1)*(x+3)),'4/[(x + 1)(x + 3)]':x=>4/((x+1)*(x+3))};
  valid=([,v])=>{assert.ok(choices[v]);return [-8,-5,-4,0,1,2,3,7].every(x=>close(1/(x*x+5*x+6)+1/(x*x+3*x+2),choices[v](x)));};
 }
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([key])=>key),[q.answer],q.id);
}
assert.equal(batch.records.length,3);console.log(JSON.stringify({passed:true,count:3,question_ids:batch.records.map(r=>r.id)}));
