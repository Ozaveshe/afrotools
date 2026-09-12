'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {questionFingerprint:fp,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const inventory=require('./original-inventory.json'),{fixtureLedger}=require('./check-candidate-integrity.cjs');
const sha=x=>crypto.createHash('sha256').update(x).digest('hex');
function verifyBatchSize(b,file){
 if(file==='crk-recovery006.json'){
  assert.equal(b.examined_count,15,'final recovery size');
  assert.deepEqual(b.selection_ids,require('./recovery-final-selection.cjs'),'exact final fifteen selection');
 }else assert.equal(b.examined_count,40,'ordinary recovery size');
 assert.equal(b.records.length+b.held_records.length,b.examined_count,'recovery disposition count');
 assert.deepEqual([...b.records,...b.held_records].map(r=>r.id).sort(),[...b.selection_ids].sort(),'recovery selection membership');
}
function load(overrides={}){
 const manifest=overrides.manifest||require('./recovery-manifest.json'),rows=new Map(),examined=new Set(),slots=new Set();
 assert.deepEqual(manifest.batches,require('./recovery-pins.cjs'),'independent recovery pins mismatch');
 for(const f of fs.readdirSync(__dirname).filter(f=>/^crk-wave\d+\.json$/.test(f)))for(const r of require('./'+f).records)slots.add(r.actual_source_year+':'+r.actual_source_number);
 assert.deepEqual(manifest.batches.map(p=>p.file).sort(),fs.readdirSync(__dirname).filter(f=>/^crk-recovery\d+\.json$/.test(f)).sort());
 for(const pin of manifest.batches){
  assert.match(pin.file,/^crk-recovery\d+\.json$/);const raw=overrides.files?.[pin.file]||fs.readFileSync(path.join(__dirname,pin.file));assert.equal(sha(raw),pin.sha256,'recovery manifest mismatch');
  const b=JSON.parse(raw),ledger=fixtureLedger(b);verifyBatchSize(b,pin.file);
  assert.equal(b.source.content_sha256,inventory.source.content_sha256);assert.equal(b.source.source_file,inventory.source.source_file);
  assert.deepEqual([...b.records,...b.held_records].map(r=>r.id).sort(),[...b.selection_ids].sort());
  for(const page of b.source_page_evidence)assert.equal(sha(page.text),page.content_sha256);
  for(const r of [...b.records,...b.held_records]){
   assert.ok(!examined.has(r.id),'duplicate recovery examination');examined.add(r.id);
   assert.match(r.firstpass_file,/^crk-wave\d+\.json$/);const priorRaw=fs.readFileSync(path.join(__dirname,r.firstpass_file));assert.equal(sha(priorRaw),r.firstpass_sha256,'first-pass evidence changed');
   const old=JSON.parse(priorRaw).held_records.find(h=>h.id===r.id);assert.ok(old,'recovery must originate in a first-pass hold');assert.equal(fp(old),r.firstpass_held_sha256);
   assert.equal(r.original_content_sha256,old.original_content_sha256);
   assert.equal(r.source_pdf_page,old.source_pdf_page);assert.ok(b.source_page_evidence.some(p=>p.page===r.source_pdf_page));
   if(!r.candidate){assert.ok(r.recovery_review.length>60);continue;}
   assert.equal(fp(r.original_record),old.original_content_sha256);assert.equal(fp(r.candidate),r.content_sha256);
   assert.equal(r.candidate.id,r.id);assert.equal(r.candidate.year,old.actual_year);assert.equal(r.candidate.num,old.num);
   assert.equal(r.actual_source_year,old.actual_year);assert.equal(r.actual_source_number,old.num);
   const slot=old.actual_year+':'+old.num;assert.ok(!slots.has(slot),'duplicate recovered source slot');slots.add(slot);
   assert.deepEqual(r.semantic_review.biblical_evidence,old.biblical_evidence);
   for(const e of r.semantic_review.biblical_evidence){assert.equal(fp(e.verses),e.content_sha256);assert.equal(e.download_sha256,inventory.biblical_reference.content_sha256);}
   assert.equal(r.candidate.explanation,r.candidate.ai_explanation);assert.equal(r.candidate.explanation,r.semantic_review.independent_reasoning);assert.ok(r.candidate.explanation.length>70);
   assert.doesNotMatch(JSON.stringify([r.candidate.question,r.candidate.options,r.candidate.explanation]),/repair history|first.pass|recovery review|original answer|\[PAGE/i);
   assert.equal(assessQuestion(r.candidate,ledger).state,'eligible');rows.set(r.id,{row:r,batch:b});
  }
 }
 return {rows,examined};
}
function accepted(q,entry,ledger){
 assert.ok(entry,'changed held row has no recovery evidence');assert.equal(fp(q),entry.row.content_sha256,'held row must match exact recovery');
 assert.equal(ledger?.questions?.[q.id]?.source_id,entry.batch.source_id);
 assert.equal(ledger.sources?.[entry.batch.source_id]?.content_sha256,inventory.source.content_sha256);
 assert.equal(ledger.sources?.[entry.batch.source_id]?.source_file,inventory.source.source_file);
 assert.equal(assessQuestion(q,ledger).state,'eligible','recovered held row needs accepted ledger evidence');
 return entry.row.original_record;
}
function verify(pool,ledger){const {rows,examined}=load(),current=new Map(pool.map(q=>[q.id,q]));let integrated=0;
 for(const id of examined){const q=current.get(id),pin=inventory.records.find(r=>r.id===id);assert.ok(q);if(fp(q)!==pin.original_content_sha256){accepted(q,rows.get(id),ledger);integrated++;}}
 return {passed:true,examined:examined.size,recovered:rows.size,still_held:examined.size-rows.size,integrated};
}
module.exports={load,accepted,verify,verifyBatchSize};
if(require.main===module){const i=process.argv.indexOf('--source-root'),root=i<0?path.resolve(__dirname,'../../../..'):path.resolve(process.argv[i+1]);console.log(JSON.stringify(verify(require(path.join(root,'ops/jamb/source-pool.json')).questions,require(path.join(root,'data/jamb/review-ledger.json')))));}
