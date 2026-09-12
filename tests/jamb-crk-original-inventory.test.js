'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {verify}=require('../ops/jamb/review-candidates/crk/check-original-inventory.cjs');
const pool=require('../ops/jamb/source-pool.json').questions;
test('CRK inventory pins all original IDs, content and cumulative printed slots',()=>{const r=verify(pool);assert.equal(r.originals,1020);assert.ok(r.examined>=40);});
test('CRK inventory rejects omissions, duplicate IDs and changed original content',()=>{
 const q=pool.find(q=>q.subject==='crk');
 assert.throws(()=>verify(pool.filter(r=>r.id!==q.id)));
 assert.throws(()=>verify([...pool,q]));
 assert.throws(()=>verify(pool.map(r=>r.id===q.id?{...r,answer:'Z'}:r)));
});
test('CRK integrated inventory requires exact candidates and matching accepted evidence',()=>{
 const batch=require('../ops/jamb/review-candidates/crk/crk-wave001.json');
 const {fixtureLedger}=require('../ops/jamb/review-candidates/crk/check-candidate-integrity.cjs');
 const {questionFingerprint:fp}=require('../scripts/lib/jamb-content-trust');
 const ledger={...require('../data/jamb/review-ledger.json'),sources:{...require('../data/jamb/review-ledger.json').sources,...fixtureLedger(batch).sources},questions:{...require('../data/jamb/review-ledger.json').questions,...fixtureLedger(batch).questions}};
 const candidates=new Map(batch.records.map(r=>[r.id,r.candidate])),after=pool.map(q=>candidates.get(q.id)||q);
 assert.equal(verify(after,ledger).originals,1020);
 const r=batch.records[0],bad={...r.candidate,answer:'Z'},forged=structuredClone(ledger);forged.questions[r.id].content_sha256=fp(bad);
 assert.throws(()=>verify(after.map(q=>q.id===r.id?bad:q),forged));
 const rejected=structuredClone(ledger);rejected.questions[r.id].answer_review.status='pending';
 assert.throws(()=>verify(after,rejected));
});
