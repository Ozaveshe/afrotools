'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1985-publishable-901.json');
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
for(const record of batch.records){
 const q=pool.find(q=>q.id===record.id);assert.equal(questionFingerprint(q),record.content_sha256);
 const eastY=360-153,angle=Math.abs(eastY-147)*Math.PI/180;
 const radius=40000/(2*Math.PI),parallelRadius=radius*Math.cos(Math.PI/3);
 const expected=Math.round(angle*parallelRadius);assert.equal(expected,3333);
 assert.deepEqual(Object.entries(q.options).filter(([,s])=>Number.parseInt(s.replace(/,/g,''))===expected).map(([k])=>k),['E']);
 assert.equal(q.answer,'E');assert.match(q.question,/shorter/);assert.match(q.ai_explanation,/date line/);
 assert.equal(assessQuestion(q,ledger).state,'eligible');
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id)}));
