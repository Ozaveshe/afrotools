'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1986-publishable-002.json');
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length,2);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);
 assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);
 let result,parse;
 if(q.num===44){
  assert.match(q.question,/length 4 m, width 3 m and height 4 m/);
  // Enumerate the five exposed faces independently of the stored worked answer.
  const faces=[[4,3],[4,4],[4,4],[3,4],[3,4]];
  result=faces.reduce((sum,[a,b])=>sum+a*b,0)*2;
  parse=value=>Number(value.replace('₦',''));
  assert.equal(result,136);
 }else{
  assert.equal(q.num,47);assert.match(q.question,/40 to 50 inclusive/);
  const integers=Array.from({length:11},(_,i)=>40+i);
  const prime=n=>{for(let d=2;d*d<=n;d++)if(n%d===0)return false;return n>1;};
  const primes=integers.filter(prime);assert.deepEqual(primes,[41,43,47]);
  result=primes.length/integers.length;
  parse=value=>{const parts=value.split('/').map(Number);return parts[0]/parts[1];};
 }
 assert.deepEqual(Object.entries(q.options).filter(([,v])=>Math.abs(parse(v)-result)<1e-12).map(([k])=>k),[q.answer]);
}
console.log(JSON.stringify({passed:true,count:batch.records.length,question_ids:batch.records.map(r=>r.id)}));
