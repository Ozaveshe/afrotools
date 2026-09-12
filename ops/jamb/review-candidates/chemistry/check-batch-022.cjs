'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-022.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,10);assert.equal(new Set(batch.records.map(r=>r.id)).size,10);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,7);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([68,70].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=2004)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
const {assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
for(const r of batch.records.filter(r=>r.publication_candidate)){
 const reasons=assessQuestion(r.candidate).reasons;
 for(const reason of ['missing_visual_or_description','missing_passage_or_context','incomplete_options','duplicate_option_text','explanation_requires_correction'])assert.ok(!reasons.includes(reason),r.id+':'+reason);
}


for(const n of [48,49,50])assert.equal(get(n,2003).year,2003);
assert.equal(get(48,2003).answer,'D');assert.equal(get(49,2003).answer,'B');assert.equal(get(50,2003).answer,'A');
assert.equal(get(48).answer,'A');assert.equal(get(49).answer,'B');
assert.match(get(44).explanation,/s and nearby d/);assert.match(get(45).explanation,/adsorbs/);
const masses={O2:32,Cl2:71,H2:2,NH3:17},air=28.97;
assert.deepEqual(Object.keys(masses).filter(k=>masses[k]>air),['O2','Cl2']);
const held=batch.records.filter(r=>!r.publication_candidate);assert.equal(held.length,3);
for(const n of [46,47,50])assert.ok(held.some(r=>r.original_record.year===2004&&r.original_record.num===n));
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'),batch.source_pdf_sha256);
console.log('Chemistry batch022:10 examined,7 candidates,3 held; '+(integrated?'integrated':'pre-intake')+' fingerprints, PDF/context gates and independent checks passed.');
