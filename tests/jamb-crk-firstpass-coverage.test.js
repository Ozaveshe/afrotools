'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D='../ops/jamb/review-candidates/crk/',pool=require('../ops/jamb/source-pool.json').questions;
test('complete CRK coverage pins every original and all batch manifests',()=>{
 const {verify}=require(D+'check-firstpass-coverage.cjs'),receipt=require(D+'firstpass-coverage.json');
 assert.equal(verify(pool).examined,1020);
 for(const change of [r=>r.batches.pop(),r=>r.batches[0].sha256='0'.repeat(64),r=>r.coverage.held++,r=>r.original_ids_sha256='forged']){
  const changed=structuredClone(receipt);change(changed);assert.throws(()=>verify(pool,undefined,changed));
 }
});
test('only the exact final twenty CRK IDs qualify for a short batch',()=>{
 const b=structuredClone(require(D+'crk-wave021.json')),{verifyBatch}=require(D+'check-candidate-integrity.cjs');
 b.records=b.records.slice(0,20);b.held_records=[];b.examined_count=20;
 const pins=Object.fromEntries(b.records.map(r=>[r.id,{answer:r.candidate.answer,year:r.candidate.year,num:r.candidate.num,content_sha256:r.content_sha256}]));
 const originals=new Map(b.records.map(r=>[r.id,r.original_record]));
 const candidates=new Map(b.records.map(r=>[r.id,r.candidate]));
 const before=pool.map(q=>originals.get(q.id)||q),after=pool.map(q=>candidates.get(q.id)||q);
 assert.throws(()=>verifyBatch(b,pins,before),/pinned final twenty/);
 assert.throws(()=>verifyBatch(b,pins,after,true),/pinned final twenty/);
 b.examined_count=40;assert.throws(()=>verifyBatch(b,pins,before));
});
