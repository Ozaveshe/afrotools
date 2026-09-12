'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const D=path.resolve(__dirname,'../ops/jamb/review-candidates/crk'),coverage=require(D+'/check-recovery-coverage.cjs'),gate=require(D+'/check-recovery-integrity.cjs');
const all=fs.readdirSync(D).filter(f=>/^crk-(?:wave|recovery)\d+\.json$/.test(f)).map(f=>require(D+'/'+f)),rows=all.flatMap(b=>b.records),original=new Map(rows.map(r=>[r.id,r.original_record])),candidates=new Map(rows.map(r=>[r.id,r.candidate]));
const pool=require('../ops/jamb/source-pool.json').questions.map(q=>original.get(q.id)||q),{fixtureLedger}=require(D+'/check-candidate-integrity.cjs'),ledger=fixtureLedger(all[0]);
for(const b of all)Object.assign(ledger.questions,fixtureLedger(b).questions);
const after=pool.map(q=>candidates.get(q.id)||q),receipt=require(D+'/recovery-coverage.json');
test('CRK recovery covers all215 firstpass holds before and after exact accepted integration',()=>{
 assert.equal(coverage.verify(pool).integrated_recoveries,0);
 const result=coverage.verify(after,ledger);assert.equal(result.integrated_recoveries,37);assert.equal(result.candidates,842);assert.equal(result.held,178);assert.equal(result.remaining,0);
});
test('CRK complete recovery rejects omitted, duplicate, forged and reclassified dispositions',()=>{
 for(const change of [r=>r.dispositions.pop(),r=>r.dispositions[1]=r.dispositions[0],r=>r.dispositions[0].original_content_sha256='forged',r=>r.dispositions[0].disposition='invented',r=>r.counts.held--,r=>r.original_hold_ids.reverse(),r=>r.firstpass_coverage_sha256='forged']){const bad=structuredClone(receipt);change(bad);assert.throws(()=>coverage.verify(after,ledger,bad));}
});
test('CRK final fifteen exception pins exact IDs and disposition membership',()=>{
 const final=require(D+'/crk-recovery006.json');gate.verifyBatchSize(final,'crk-recovery006.json');
 for(const change of [b=>b.selection_ids[0]='other',b=>b.held_records[0].id='other',b=>b.held_records.pop(),b=>b.examined_count=40]){const bad=structuredClone(final);change(bad);assert.throws(()=>gate.verifyBatchSize(bad,'crk-recovery006.json'));}
 assert.throws(()=>gate.verifyBatchSize(final,'crk-recovery005.json'));
});
test('CRK recovery coverage rejects mutated held content and forged accepted evidence',()=>{
 const held=receipt.dispositions.find(r=>r.disposition==='held').id,recovered=receipt.dispositions.find(r=>r.disposition==='recovered').id;
 assert.throws(()=>coverage.verify(after.map(q=>q.id===held?{...q,answer:'invented'}:q),ledger));
 const forged=structuredClone(ledger);forged.questions[recovered].answer_review.status='pending';assert.throws(()=>coverage.verify(after,forged));
});
