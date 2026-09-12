'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const batch=require('../ops/jamb/review-candidates/english/english-2018-003.json');
const {verify}=require('../ops/jamb/review-candidates/english/check-english-2018-003.cjs');
const pool=require('../ops/jamb/source-pool.json').questions;
const candidateById=new Map(batch.records.map(r=>[r.id,r.candidate]));
const originalById=new Map(batch.records.map(r=>[r.id,r.original_record]));
const originals=pool.map(q=>originalById.get(q.id)||q);
const integrated=pool.map(q=>candidateById.get(q.id)||q);
test('wave5 intake modes reject stale or prematurely changed pool content',()=>{
 assert.equal(verify(originals).candidates,34);
 assert.equal(verify(integrated,true).held,6);
 assert.throws(()=>verify(integrated),/original pool mismatch/);
 assert.throws(()=>verify(originals,true),/integrated candidate mismatch/);
 const id=batch.records.find(r=>r.candidate.passage).id;
 assert.throws(()=>verify(integrated.map(q=>q.id===id?{...q,passage:'Missing context'}:q),true),/integrated candidate mismatch/);
});
test('English batches have distinct candidate and held IDs with private held reasons',()=>{
 const dir=path.resolve(__dirname,'../ops/jamb/review-candidates/english'),seen=new Set();
 for(const f of fs.readdirSync(dir).filter(f=>/^english.*\.json$/.test(f))){
  const b=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  for(const r of [...b.records,...(b.held_records||[])]){
   assert.ok(!seen.has(r.id),'Repeated English intake ID '+r.id);seen.add(r.id);
   if(r.status==='needs-source-reconciliation')assert.ok(r.reason.length>60);
  }
 }
 assert.ok(seen.size>=149);
});
