'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1986-publishable-006.json');
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
const close=(a,b)=>Math.abs(a-b)<1e-10;
const fraction=v=>{const [a,b]=v.replaceAll('−','-').split('/').map(Number);return a/b;};
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);
 let valid;
 if(q.num===5){
  const original=(2/3)/(1/2+1/3);valid=([,v])=>close(fraction(v)*original,1);
 }else if(q.num===7){
  const numerator=(18-21)**3+(-4)**2,denominator=(-6)**3;assert.equal(numerator,-11);assert.equal(denominator,-216);
  valid=([,v])=>close(fraction(v),numerator/denominator);
 }else if(q.num===29){
  const choices={'3k²':k=>3*k*k,'3k − k²':k=>3*k-k*k,'17k²/4':k=>17*k*k/4,'k²':k=>k*k};
  valid=([,v])=>{assert.ok(choices[v]);return [-3,0,1,2,5].every(k=>[-2,1,3].every(b=>[-3,1,4].every(d=>{const a=k*b,c=k*d;return close((3*a*a-a*c+c*c)/(3*b*b-b*d+d*d),choices[v](k));})));};
 }else{
  assert.equal(q.num,41);const r=2*Math.sqrt(3),l=4*Math.sqrt(3),area=Math.PI*r*l+Math.PI*r*r;
  const choices={'8√3π cm²':8*Math.sqrt(3)*Math.PI,'24π cm²':24*Math.PI,'15√3π cm²':15*Math.sqrt(3)*Math.PI,'36π cm²':36*Math.PI};
  valid=([,v])=>{assert.ok(Object.hasOwn(choices,v));return close(choices[v],area);};
 }
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([k])=>k),[q.answer],q.id);
}
assert.equal(batch.records.length,4);
console.log(JSON.stringify({passed:true,count:batch.records.length,question_ids:batch.records.map(r=>r.id)}));
