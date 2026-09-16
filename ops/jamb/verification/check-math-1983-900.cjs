'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1983-publishable-900.json');
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
for(const record of batch.records){
 const q=pool.find(q=>q.id===record.id);assert.equal(questionFingerprint(q),record.content_sha256);
 const choices=Object.entries(q.options).map(([key,text])=>{const [x,y]=[...text.matchAll(/=\s*(-?\d+)/g)].map(m=>Number(m[1]));return {key,x,y};});
 const valid=choices.filter(({x,y})=>4*x-3===3*x+y&&3*x+y===2*y+5*x-12);
 assert.deepEqual(valid,[{key:'A',x:5,y:2}]);assert.equal(q.answer,'A');
 assert.match(q.ai_explanation,/x = 5/);assert.match(q.ai_explanation,/y = 2/);
 assert.equal(assessQuestion(q,ledger).state,'eligible');
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id)}));
