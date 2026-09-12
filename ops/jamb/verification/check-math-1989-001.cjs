'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1989-001-updates.json')}:require('./math-1989-publishable-001.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const close=(a,b)=>Math.abs(a-b)<1e-9;
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.equal(q.year,1989);
 if(!draft){assert.equal(r.before.year,1988);assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);}
 let valid;
 if(q.num===2){const result=2700000*3/100/18000,choices={'4.5 × 10⁰':4.5,'4.5 × 10¹':45,'4.5 × 10²':450,'4.5 × 10³':4500};valid=([,v])=>{assert.ok(choices[v]);return choices[v]===result;};}
 else if(q.num===3){let n=2520;const primes=[];for(let p=2;p<=n;p++){if(n%p===0){primes.push(p);while(n%p===0)n/=p;}}assert.deepEqual(primes,[2,3,5,7]);valid=([,v])=>JSON.stringify(v.split(',').map(Number))===JSON.stringify(primes);}
 else if(q.num===6){
  // Exact decimal half-up rounding in millionths, avoiding binary-float tie errors.
  const source=7685,threeSignificant=Math.floor((source+5)/10)*10,fourDecimals=Math.floor((source+50)/100)*100;
  assert.equal(threeSignificant,7690);assert.equal(fourDecimals,7700);
  const result=Math.abs(fourDecimals-threeSignificant)/1000000,choices={'10⁻⁵':1e-5,'7 × 10⁻⁴':7e-4,'8 × 10⁻⁵':8e-5,'10⁻⁶':1e-6};valid=([,v])=>{assert.ok(choices[v]);return close(choices[v],result);};
 }else if(q.num===11){const choices={'(3/q)³':q=>(3/q)**3,'∛(q/3)':q=>Math.cbrt(q/3),'(q/3)³':q=>(q/3)**3,'∛(3/q)':q=>Math.cbrt(3/q)};valid=([,v])=>{assert.ok(choices[v]);return [.5,1,2,3,5,9].every(q=>close(Math.log(choices[v](q))/Math.log(3)+3*Math.log(q)/Math.log(3),3));};}
 else{assert.equal(q.num,12);valid=([,v])=>{const ys=v.replaceAll('−','-').split(' and ').map(Number);return new Set(ys).size===2&&ys.every(y=>close(9**y-4*3**y+3,0));};}
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([key])=>key),[q.answer],q.id);
}
assert.equal(batch.records.length,5);console.log(JSON.stringify({passed:true,count:5,question_ids:batch.records.map(r=>r.id)}));
