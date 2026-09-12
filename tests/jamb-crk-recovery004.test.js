'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const D='../ops/jamb/review-candidates/crk/',batch=require(D+'crk-recovery004.json'),gate=require(D+'check-recovery-integrity.cjs');
test('CRK recovery004 retains all forty ambiguous or duplicate records privately',()=>{
 assert.equal(batch.records.length,0);assert.equal(batch.held_records.length,40);gate.verifyBatchSize(batch,'crk-recovery004.json');
 const loaded=gate.load();for(const h of batch.held_records){assert.ok(loaded.examined.has(h.id));assert.ok(!loaded.rows.has(h.id));assert.ok(h.recovery_review.length>60);}
 assert.match(batch.held_records.find(h=>h.id==='crk-1995-40-c2fe275aa5e7').reason,/second/i);
});
test('CRK recovery004 cannot omit a hold or use the final fifteen exception',()=>{
 const bad=structuredClone(batch);bad.held_records.pop();assert.throws(()=>gate.verifyBatchSize(bad,'crk-recovery004.json'));
 bad.examined_count=15;bad.held_records=bad.held_records.slice(0,15);bad.selection_ids=bad.held_records.map(h=>h.id);
 assert.throws(()=>gate.verifyBatchSize(bad,'crk-recovery004.json'),/ordinary recovery size/);
 assert.throws(()=>gate.verifyBatchSize(bad,'crk-recovery006.json'),/exact final fifteen/);
});
