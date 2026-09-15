'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1985-publishable-900.json');
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
for(const record of batch.records){
 const q=pool.find(q=>q.id===record.id);assert.equal(questionFingerprint(q),record.content_sha256);
 // Independent external-secant theorem using intercepted arcs:
 // MP+PQ=172, MN+MP=244, all four arcs sum to 360.
 // Taking MN=120 yields MP=124, PQ=48, NQ=68.
 const arcs={MN:120,MP:124,PQ:48,NQ:68};
 assert.equal((arcs.MP+arcs.PQ)/2,86);assert.equal((arcs.MN+arcs.MP)/2,122);
 const x=(arcs.MP-arcs.NQ)/2,y=(arcs.MN-arcs.PQ)/2;
 assert.deepEqual([x,y],[28,36]);
 const matches=Object.entries(q.options).filter(([,s])=>JSON.stringify(s.match(/\d+/g).map(Number))===JSON.stringify([x,y]));
 assert.deepEqual(matches.map(([k])=>k),[q.answer]);assert.equal(q.answer,'A');
 assert.match(q.question,/M–N–X/);assert.match(q.question,/N–Q–Y/);
 assert.equal(q.has_diagram,false);assert.equal(assessQuestion(q,ledger).state,'eligible');
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id)}));
