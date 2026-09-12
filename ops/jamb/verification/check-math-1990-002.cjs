'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1990-002-updates.json')}:require('./math-1990-publishable-002.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8);
assert.equal(batch.records.length,5);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);}
 switch(q.num){
 case 25:
  assert.match(q.question,/x\/\(x \+ y\) \+ y\/\(x − y\) − x²/);assert.equal(q.answer,'B');assert.equal(q.options.B,'y²/(x² − y²)');
  for(const x of [-5,-2,1,4])for(const y of [-3,0,2,6])if(x!==y&&x!==-y)near(x/(x+y)+y/(x-y)-x*x/(x*x-y*y),y*y/(x*x-y*y));break;
 case 27:
  assert.equal(q.answer,'D');assert.equal(q.options.D,'log(a²¹⁰)');
  for(const a of [.3,2,5])near(Array.from({length:20},(_,i)=>Math.log(a**(i+1))).reduce((a,b)=>a+b,0),Math.log(a**210));break;
 case 28:
  assert.equal(q.answer,'D');assert.equal(q.options.D,'3(2¹⁸ − 1)');
  near(Array.from({length:18},(_,i)=>3*2**i).reduce((a,b)=>a+b,0),3*(2**18-1));break;
 case 32:
  assert.match(q.question,/10\.5 cm.*48°/);assert.equal(q.answer,'D');assert.equal((21+48/360*2*Math.PI*10.5).toFixed(1)+' cm',q.options.D);break;
 case 35:
  assert.match(q.question,/6 cm and 8 cm/);assert.equal(q.answer,'B');assert.equal(Math.hypot(6/2,8/2)+' cm',q.options.B);break;
 default:throw Error('Unchecked record');
 }
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id),count:5}));
