'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const batch=require('../ops/jamb/review-candidates/english/english-1979-005.json');
const {verify}=require('../ops/jamb/review-candidates/english/check-english-1979-005.cjs');
const pool=require('../ops/jamb/source-pool.json').questions;
const candidates=new Map(batch.records.map(r=>[r.id,r.candidate]));
const originals=new Map(batch.records.map(r=>[r.id,r.original_record]));
const before=pool.map(q=>originals.get(q.id)||q),after=pool.map(q=>candidates.get(q.id)||q);
test('wave186 rejects self-consistently rehashed answer and numbering mutations',()=>{
 const {questionFingerprint}=require('../scripts/lib/jamb-content-trust');
 const row=batch.records[0],originalCandidate=row.candidate,originalHash=row.content_sha256;
 try {
  for(const mutation of [{answer:originalCandidate.answer==='A'?'D':'A'},{num:999}]){
   row.candidate={...originalCandidate,...mutation};row.content_sha256=questionFingerprint(row.candidate);
   assert.throws(()=>verify(after.map(q=>q.id===row.id?row.candidate:q),true));
  }
 } finally {row.candidate=originalCandidate;row.content_sha256=originalHash;}
 assert.equal(verify(after,true).candidates,11);
});
test('wave186 intake preserves candidates and held records at either integration stage',()=>{
 assert.equal(verify(before).candidates,11);
 assert.equal(verify(after,true).held,9);
 assert.throws(()=>verify(after),/original pool mismatch/);
 assert.throws(()=>verify(before,true),/integrated candidate mismatch/);
 const id=batch.held_records[0].id;
 assert.throws(()=>verify(after.map(q=>q.id===id?{...q,question:q.question+' changed'}:q),true),/held pool changed/);
});
test('cumulative English examination IDs remain unique across all batches',()=>{
 const dir=path.resolve(__dirname,'../ops/jamb/review-candidates/english'),seen=new Set();
 for(const f of fs.readdirSync(dir).filter(f=>/^english.*\.json$/.test(f))){
  const b=JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
  for(const r of [...b.records,...(b.held_records||[])]){
   assert.ok(!seen.has(r.id),'Repeated English intake ID '+r.id);seen.add(r.id);
   if(r.status==='needs-source-reconciliation')assert.ok(r.reason.length>60);
  }
 }
 assert.ok(seen.size>=4143);
});
