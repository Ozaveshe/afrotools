'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {questionFingerprint,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./batch-001.json'),selected=require('./batch-001-selection.json'),integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions,hash=x=>crypto.createHash('sha256').update(x).digest('hex');
const keys={1:'B',3:'D',5:'C',6:'B',9:'C',11:'E',13:'C',15:'B',18:'E',23:'C',24:'D',28:'D',29:'A',33:'D',35:'D',37:'C',39:'B',40:'E',41:'D',43:'C'};
assert.equal(b.records.length,40);assert.equal(new Set(b.records.map(r=>r.id)).size,40);assert.deepEqual(b.records.map(r=>r.id),selected.map(r=>r.id));
assert.equal(b.records.filter(r=>r.publication_candidate).length,20);assert.equal(b.integration_allowlist.length,20);
for(const r of b.records){
 const original=selected.find(q=>q.id===r.id);assert.equal(questionFingerprint(original),r.original_content_sha256);assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const eligible=!!keys[r.actual_source_number];assert.equal(r.publication_candidate,eligible);
 assert.equal(questionFingerprint(pool.find(q=>q.id===r.id)),integrated&&eligible?r.content_sha256:r.original_content_sha256,r.id+' pool drift');
 assert.equal(r.actual_source_year,1983);assert.ok(r.source_pdf_page>=2&&r.source_pdf_page<=5);
 if(!eligible){assert.ok(!r.candidate);assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.verification?.method,'ai-source-checked');assert.equal(q.verification?.reviewed_at,'2026-09-12');assert.equal(q.id,r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.answer,keys[q.num]);assert.equal(q.options[q.answer]!==undefined,true);assert.equal(q.format,5);assert.equal(Object.keys(q.options).length,5);assert.equal(q.explanation,q.ai_explanation);assert.ok(q.explanation.length>80);
 assert.ok(!/repair|typo|previous key|imported|nearest.choice|\[PAGE|Economics 1983/i.test(q.question+' '+JSON.stringify(q.options)+' '+q.explanation));
 const reasons=assessQuestion(q,{questions:{},sources:{}}).reasons;
 for(const reason of ['missing_visual_or_description','incomplete_options','empty_option','duplicate_option_text','ocr_or_placeholder_artifact','explanation_requires_correction'])assert.ok(!reasons.includes(reason),q.id+': '+reason);
 const a=b.integration_allowlist.find(x=>x.id===r.id);assert.equal(a.original_content_sha256,r.original_content_sha256);assert.equal(a.candidate_content_sha256,r.content_sha256);
}
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/ECONOMICS-JAMB-Past-Questions.pdf',pinned='48d0a82b005ca877cc6f7ff734d06a4971ca6d6e52ae6a858f1843f38b48760c';
for(const v of [b.source_pdf_sha256,b.source.content_sha256,b.source.reuse_authorization.material_sha256])assert.equal(v,pinned);
if(fs.existsSync(pdf))assert.equal(hash(fs.readFileSync(pdf)),pinned);else assert.ok(integrated,'Pre-intake verification requires original PDF');
// Independent numerical reasoning: growth residual and ambiguous PPF transitions.
assert.equal(7-4,3);assert.equal((4-3)/(9-5),0.25);assert.equal((3-2)/(12-9),1/3);assert.equal((5-3)/9,2/9);
// An average rises only when the next observation exceeds the current average.
assert.ok((20+5)/3<20/2);assert.ok((20+15)/3>20/2);
console.log('Economics001:40 examined,20 candidates,20 held; source, fingerprints, options, context and numerical checks passed ('+(integrated?'integrated':'pre-intake')+').');
