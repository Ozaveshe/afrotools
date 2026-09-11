'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1987-002-updates.json')}:require('./math-1987-publishable-002.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const close=(a,b)=>Math.abs(a-b)<1e-10;
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);}
 let valid;
 if(q.num===13){
  const a=Number((35/6).toPrecision(3)),b=Number((35/6).toFixed(3));assert.equal(a,5.83);assert.equal(b,5.833);
  const choices={'0.003':[0.003,false],'3.0 × 10⁻³':[3e-3,true],'0.3 × 10²':[30,false],'0.3 × 10⁻³':[0.0003,false]};
  valid=([,v])=>{assert.ok(choices[v]);return choices[v][1]&&close(choices[v][0],b-a);};
 }else if(q.num===14){
  const result=(Math.log2(6)-Math.log2(3))/(Math.log2(8)-2*Math.log2(.5));
  const choices={'1/5':1/5,'1/2':1/2,'−1/2':-1/2,'log₂(3)/log₂(7)':Math.log2(3)/Math.log2(7)};
  valid=([,v])=>{assert.ok(Object.hasOwn(choices,v));return close(choices[v],result);};
 }else if(q.num===15){
  const result=(2*Math.sqrt(14)*3*Math.sqrt(21))/(7*Math.sqrt(24)*2*Math.sqrt(98));
  valid=([,v])=>{const m=v.match(/^3√(\d+)\/(\d+)$/);assert.ok(m);return close(3*Math.sqrt(Number(m[1]))/Number(m[2]),result);};
 }else{
  assert.equal(q.num,20);
  const choices={'y = 1/(Z − x²)³':(x,z)=>1/(z-x*x)**3,'y = 1/∛(Z + x³)':(x,z)=>1/Math.cbrt(z+x**3),'y = 1/∛(Z − x²)':(x,z)=>1/Math.cbrt(z-x*x),'y = 1/(∛Z − ∛(x²))':(x,z)=>1/(Math.cbrt(z)-Math.cbrt(x*x))};
  // Substitute each proposed rearrangement into the original formula, including negative cube roots.
  valid=([,v])=>{assert.ok(choices[v]);return [[2,12],[3,1],[-2,31],[1,-7],[0,27]].every(([x,z])=>{const y=choices[v](x,z);return Number.isFinite(y)&&y!==0&&close(x*x+1/y**3,z);});};
 }
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([key])=>key),[q.answer],q.id);
}
assert.equal(batch.records.length,4);
console.log(JSON.stringify({passed:true,count:4,question_ids:batch.records.map(r=>r.id)}));
