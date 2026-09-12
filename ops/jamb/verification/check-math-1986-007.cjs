'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1986-publishable-007.json');
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length,1);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 assert.equal(questionFingerprint(q),r.content_sha256);
 assert.equal(q.year,1986);assert.equal(r.before.year,1987);
 assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);
 const pairs=[...q.question.matchAll(/\((\d+), (\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);
 assert.deepEqual(pairs,[[1,2],[2,4],[3,7],[4,14],[5,12],[6,6],[7,4],[8,1]]);
 assert.deepEqual(pairs,r.source_frequencies);
 const max=Math.max(...pairs.map(([,n])=>n));
 const modes=pairs.filter(([,n])=>n===max).map(([score])=>score);
 assert.deepEqual(modes,[4]);
 const count=pairs.filter(([score])=>score<=4).reduce((sum,[,n])=>sum+n,0);
 assert.equal(count,27);
 assert.deepEqual(Object.entries(q.options).filter(([,v])=>v===`(${count}, ${modes[0]})`).map(([key])=>key),[q.answer]);
}
console.log(JSON.stringify({passed:true,count:batch.records.length,question_ids:batch.records.map(r=>r.id)}));
