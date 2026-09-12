'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const arg=process.argv.find(x=>x.startsWith('--source-root=')),root=arg?path.resolve(arg.slice(14)):path.resolve(__dirname,'../../../..'),dir=path.join(root,'ops/jamb/review-candidates/government');
const {questionFingerprint:fp,assessQuestion}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const read=f=>JSON.parse(fs.readFileSync(path.join(dir,f))),batches=Array.from({length:67},(_,i)=>read('batch-'+String(i+1).padStart(3,'0')+'.json')),pool=read('../../source-pool.json').questions.filter(q=>q.subject==='government'),receipt=read('coverage-through-067.json'),ledger=read('../../../../data/jamb/review-ledger.json'),sources=read('sources.json');
const integrated=process.argv.includes('--integrated');
function validate(bs,questions=pool,accepted=ledger,mode=integrated){
 const rows=bs.flatMap(b=>b.records);assert.equal(bs.length,67);assert.equal(rows.length,2655);assert.equal(bs.at(-1).records.length,15);assert.deepEqual(rows.map(r=>r.id),questions.map(q=>q.id));assert.equal(new Set(rows.map(r=>r.id)).size,2655);
 for(let i=0;i<rows.length;i++){
  const r=rows[i],q=questions[i];assert.equal(fp(r.original_record),r.original_content_sha256,'Pinned original drift');
  if(r.publication_candidate){assert.equal(fp(r.candidate),r.content_sha256,'Candidate pin drift');assert.equal(r.candidate.id,r.id);}
  if(mode&&r.publication_candidate){
   assert.equal(fp(q),r.content_sha256,'Accepted pool candidate drift');
   const e=accepted.questions[r.id];assert.ok(e,'Accepted ledger entry required');assert.equal(e.content_sha256,r.content_sha256);assert.equal(e.source_id,r.source_id);
   assert.equal(accepted.sources[r.source_id].content_sha256,r.source_pdf_sha256);assert.equal(accepted.sources[r.source_id].source_file,sources.find(s=>s.source_id===r.source_id).filename);
   for(const key of ['question_review','answer_review','explanation_review'])assert.equal(e[key]?.status,'accepted');
   assert.equal(assessQuestion(q,accepted).state,'eligible','Actual ledger publication eligibility required');
  }else assert.equal(fp(q),r.original_content_sha256,r.publication_candidate?'Original pool drift':'Held original changed');
 }
 assert.equal(receipt.unique_examined,rows.length);assert.equal(receipt.candidates,rows.filter(r=>r.publication_candidate).length);assert.equal(receipt.held,rows.filter(r=>!r.publication_candidate).length);assert.equal(receipt.unchecked,0);assert.equal(receipt.next_id,null);return rows;
}
const rows=validate(batches);validate(batches,rows.map(r=>r.original_record),{},false);
for(const mutation of ['missing','duplicate','reorder','extra']){const b=structuredClone(batches),last=b.at(-1).records;if(mutation==='missing')last.pop();if(mutation==='duplicate')last[14]=last[13];if(mutation==='reorder')[last[13],last[14]]=[last[14],last[13]];if(mutation==='extra')last.push(last[0]);assert.throws(()=>validate(b));}
let integratedNegatives=0;
if(integrated){
 const candidate=rows.find(r=>r.publication_candidate),held=rows.find(r=>!r.publication_candidate);
 for(const mutate of [l=>delete l.questions[candidate.id],l=>l.questions[candidate.id].content_sha256='0'.repeat(64),l=>l.questions[candidate.id].answer_review.status='held',l=>l.sources[candidate.source_id].content_sha256='0'.repeat(64)]){const bad=structuredClone(ledger);mutate(bad);assert.throws(()=>validate(batches,pool,bad));integratedNegatives++;}
 for(const r of [candidate,held]){const changed=pool.map(q=>q.id===r.id?{...q,question:q.question+' changed'}:q),forged=structuredClone(ledger);if(r.publication_candidate)forged.questions[r.id].content_sha256=fp(changed.find(q=>q.id===r.id));assert.throws(()=>validate(batches,changed,forged));integratedNegatives++;}
}
console.log(JSON.stringify({passed:true,mode:integrated?'integrated':'original',examined:rows.length,candidates:receipt.candidates,held:receipt.held,unchecked:0,next_id:null,tail_negatives:4,integrated_negatives:integratedNegatives,original_fixture_checked:true,shared_writes:0}));
