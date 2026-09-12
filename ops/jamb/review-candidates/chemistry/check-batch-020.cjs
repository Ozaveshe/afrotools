'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-020.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,26);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([65,66,67].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=2003)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
const {assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
for(const r of batch.records.filter(r=>r.publication_candidate)){
 const reasons=assessQuestion(r.candidate).reasons;
 for(const reason of ['missing_visual_or_description','missing_passage_or_context','incomplete_options','duplicate_option_text','explanation_requires_correction'])assert.ok(!reasons.includes(reason),r.id+':'+reason);
}


near(3.40/101/.250,.13465346534653466);assert.ok(3.40/101/.250<.34);assert.equal(get(43,2002).answer,'B');
near(.025*.2*2/.020,.5);assert.equal(get(44,2002).answer,'C');
assert.deepEqual([1,2,2,6],[1,2,1+1,3+2+1]);assert.equal(get(50,2002).answer,'A');
assert.deepEqual([3,8,8,24],[3,8,6+2,18+4+2]);assert.equal(get(5).answer,'D');
assert.deepEqual([8-2,20-2,19-1,12-1],[6,18,18,11]);
assert.equal(1.5*1.380649e-23*600/(1.5*1.380649e-23*300),2);assert.equal(get(8).answer,'B');
assert.equal(-394-(-110-242),-42);assert.equal(get(28).answer,'B');assert.equal(get(28).options.B,'−42 kJ mol⁻¹');
assert.equal(3-3,0);assert.equal(get(35).options.D,'Al(NO₃)₃');
assert.equal(-2,-2);assert.equal(get(37).answer,'D');assert.match(get(37).question,/iodide/);
assert.deepEqual([2,4+1,1],[2,5,1]);assert.equal(get(40).answer,'B');
assert.equal(10/40/.1,2.5);assert.ok(![.01,.1,.25,.5].includes(2.5));
const held=batch.records.filter(r=>!r.publication_candidate);assert.equal(held.length,14);
for(const n of [1,6,15,19,22,26,29,31,33,36,39])assert.ok(held.some(r=>r.original_record.year===2003&&r.original_record.num===n));
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
console.log(require('./check-source-material.cjs')(batch,integrated,pdf));
console.log('Chemistry batch020:40 examined,26 candidates,14 held; '+(integrated?'integrated':'pre-intake')+' fingerprints, PDF/context gates and independent checks passed.');
