'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const batch=require('../ops/jamb/review-candidates/mathematics/math-recovery-001.json');
const {verify}=require('../ops/jamb/review-candidates/mathematics/check-math-recovery-001.cjs');
const {questionFingerprint:fp}=require('../scripts/lib/jamb-content-trust');
test('exact polynomial remainders rule out every proposed common factor',()=>{
 assert.equal(verify(batch,[batch.records[0].original_record]).passed,true);
 assert.equal(verify(batch,[batch.records[0].candidate],true).passed,true);
});
test('rehashed wrong answers and changed cubic cannot be accepted',()=>{
 for(const answer of ['A','B','C','D']){const b=structuredClone(batch);b.records[0].candidate.answer=answer;b.records[0].content_sha256=fp(b.records[0].candidate);assert.throws(()=>verify(b,[batch.records[0].original_record]),/divisibility answer/);}
 const b=structuredClone(batch);b.records[0].candidate.question=b.records[0].candidate.question.replace('a³','8a³');b.records[0].content_sha256=fp(b.records[0].candidate);assert.throws(()=>verify(b,[batch.records[0].original_record]));
});
test('changed source identity and current record are rejected',()=>{
 const b=structuredClone(batch);b.source.content_sha256='0'.repeat(64);assert.throws(()=>verify(b,[batch.records[0].original_record]));
 const q=structuredClone(batch.records[0].candidate);q.options.A='a + 3b';assert.throws(()=>verify(batch,[q],true),/current record changed/);
});
