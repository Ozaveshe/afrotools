'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const batch=require('../ops/jamb/review-candidates/english/english-2018-002.json');
const {verify}=require('../ops/jamb/review-candidates/english/check-english-2018-002.cjs');
const pool=require('../ops/jamb/source-pool.json').questions;
const candidateById=new Map(batch.records.map(r=>[r.id,r.candidate]));
const originalById=new Map(batch.records.map(r=>[r.id,r.original_record]));
const originals=pool.map(q=>originalById.get(q.id)||q);
const integrated=pool.map(q=>candidateById.get(q.id)||q);
test('next40 checker accepts original pool only before intake and candidates after intake',()=>{
 assert.equal(verify(originals).candidates,27);
 assert.equal(verify(integrated,true).held,13);
 assert.throws(()=>verify(integrated),/original pool mismatch/);
 assert.throws(()=>verify(originals,true),/integrated candidate mismatch/);
});
test('next40 checker rejects altered passage and held record after intake',()=>{
 const passageId=batch.records.find(r=>r.candidate.passage).id;
 assert.throws(()=>verify(integrated.map(q=>q.id===passageId?{...q,passage:q.passage+' Changed.'}:q),true),/integrated candidate mismatch/);
 const heldId=batch.held_records[0].id;
 assert.throws(()=>verify(integrated.map(q=>q.id===heldId?{...q,answer:'A'}:q),true),/held pool changed/);
});
