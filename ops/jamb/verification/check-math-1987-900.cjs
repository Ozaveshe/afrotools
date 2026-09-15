'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1987-publishable-900.json');
const pool=JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const ledger=JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
for(const record of batch.records){
 const q=pool.find(q=>q.id===record.id);assert.equal(questionFingerprint(q),record.content_sha256);
 if(q.num===27){
  // Polynomial cross-products establish identity without cancelling factors.
  for(let x=-6;x<=6;x++)for(let y=-6;y<=6;y++)assert.ok((x*x-y*y)*(2*x-y)===(2*x*x+x*y-y*y)*(x-y));
  const x=3,y=1,v=(x*x-y*y)/(2*x*x+x*y-y*y);
  const options=[(x+y)/(2*x+y),(x+y)/(2*x-y),(x-y)/(2*x-y),(x-y)/(2*x+y)];
  assert.deepEqual(options.map((n,i)=>Math.abs(n-v)<1e-12?i:null).filter(n=>n!==null),[2]);
  assert.equal(q.options.C,'(x − y)/(2x − y)');
 }else if(q.num===46){
  const daylightMinutes=19*60-(5*60+30),darknessMinutes=1440-daylightMinutes;
  assert.deepEqual([daylightMinutes/4,darknessMinutes/4],[202.5,157.5]);
  assert.equal(q.options.C,'202°30′, 157°30′');assert.match(q.question,/360° for 24 hours/);
 }else throw Error('Unexpected record');
 assert.equal(q.answer,'C');assert.equal(assessQuestion(q,ledger).state,'eligible');
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id)}));
