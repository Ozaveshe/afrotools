'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {questionFingerprint:fp,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const inventory=require('./original-inventory.json'),originalPins=new Map(inventory.records.map(r=>[r.id,r.original_content_sha256]));
function sha(s){return crypto.createHash('sha256').update(s).digest('hex');}
function fixtureLedger(batch){const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-12',evidence:'Candidate-only independently checked biblical and exam source fixture'};return {sources:{[batch.source_id]:batch.source},questions:Object.fromEntries(batch.records.map(r=>[r.id,{source_id:batch.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review}]))};}
function verifyBatch(batch,pins,pool,integrated=false,acceptedLedger=require('../../../../data/jamb/review-ledger.json')){
 const current=new Map(pool.map(q=>[q.id,q])),seen=new Set(),slots=new Set(),ledger=fixtureLedger(batch);
 assert.equal(batch.source.content_sha256,inventory.source.content_sha256);
 assert.equal(batch.source.source_file,inventory.source.source_file);
 for(const p of batch.source_page_evidence){assert.equal(sha(p.text),p.content_sha256);assert.ok(batch.source.pages.includes(p.page));}
 function evidence(r){assert.ok(batch.source.pages.includes(r.source_pdf_page));assert.ok(r.semantic_review?.biblical_evidence?.length||r.biblical_evidence?.length);for(const e of r.semantic_review?.biblical_evidence||r.biblical_evidence){assert.equal(fp(e.verses),e.content_sha256);assert.equal(e.download_sha256,inventory.biblical_reference.content_sha256);assert.ok(e.verses.some(v=>v.text.length>5));assert.equal(new URL(e.source_url).hostname,'ebible.org');}}
 for(const r of batch.records){
  assert.ok(!seen.has(r.id));seen.add(r.id);assert.equal(r.id,r.candidate.id);
  assert.equal(r.original_content_sha256,originalPins.get(r.id));assert.equal(fp(r.original_record),r.original_content_sha256);
  assert.equal(fp(r.candidate),r.content_sha256);
  assert.deepEqual({answer:r.candidate.answer,year:r.candidate.year,num:r.candidate.num,content_sha256:r.content_sha256},pins[r.id],'independently pinned answer/year/number/content '+r.id);
  const slot=r.candidate.year+':'+r.candidate.num;assert.ok(!slots.has(slot),'duplicate source slot');slots.add(slot);
  assert.equal(r.actual_source_year,r.candidate.year);assert.equal(r.actual_source_number,r.candidate.num);
  assert.equal(r.candidate.explanation,r.candidate.ai_explanation);assert.ok(r.candidate.explanation.length>70);assert.equal(r.semantic_review.independent_reasoning,r.candidate.explanation);
  assert.equal(r.candidate.verification.method,'ai-source-checked');assert.ok(r.repair_history.length>60);evidence(r);
  assert.doesNotMatch(JSON.stringify([r.candidate.question,r.candidate.options,r.candidate.explanation]),/\[PAGE\s+\d+\]|CHRISTIAN RELIGIOUS KNOWLEDGE\s+\d|repair history|original answer|original key|malformed|source reconciliation/i);
  const a=assessQuestion(r.candidate,ledger);assert.equal(a.state,'eligible',r.id+': '+a.reasons.join(','));
  assert.deepEqual(current.get(r.id),integrated?r.candidate:r.original_record,r.id+': '+(integrated?'integrated candidate':'original pool')+' mismatch');
 }
 for(const r of batch.held_records){assert.ok(!seen.has(r.id));seen.add(r.id);assert.equal(r.original_content_sha256,originalPins.get(r.id));
  if(fp(current.get(r.id))!==r.original_content_sha256){
   try{const recovery=require('./check-recovery-integrity.cjs');recovery.accepted(current.get(r.id),recovery.load().rows.get(r.id),acceptedLedger);}catch(error){throw new Error('held pool changed: '+error.message);}
  }
  assert.ok(r.reason.length>60);evidence(r);}
 assert.equal(Object.keys(pins).length,batch.records.length);assert.equal(seen.size,batch.examined_count);
 if(batch.examined_count===20)assert.deepEqual([...seen].sort(),inventory.records.slice(1000).map(r=>r.id).sort(),'only the pinned final twenty originals form a short batch');
 else assert.equal(batch.examined_count,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:seen.size,candidates:batch.records.length,held:batch.held_records.length,scope:batch.checker_scope};
}
module.exports={verifyBatch,fixtureLedger};
