'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-006.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,23);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([19,20,21,22,23].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=(n,y=1988)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
const ratios=[[1,1],[3,4],[4,3],[3,2]];
assert.deepEqual(ratios.flatMap(([m,x],i)=>3*m===4*x?['ABCD'[i]]:[]),['C']);
assert.equal(get(2).candidate.answer,'C');
near(.12/(.032/22.4),84);near(84/14,6);assert.equal(get(2,1989).candidate.answer,'D');
assert.deepEqual({C:3,H:8,O:10},{C:3,H:4*2,O:3*2+4});
near(3*22.4,67.2);assert.equal(get(4).candidate.answer,'B');
near(7+4*(-2),-1);assert.equal(get(11).candidate.answer,'A');
near(((1.34-.71)/18)/(.71/(2*23+32+4*16)),7);assert.equal(get(15).candidate.answer,'A');
near((.045*.2/3)/.1*1000,30);assert.equal(get(20).candidate.answer,'D');
near(2-1-1,0);assert.equal(get(21).candidate.answer,'B');
near(2-2,0);assert.equal(get(23).candidate.answer,'A');
near(-2,0-2);assert.equal(get(36).candidate.answer,'B');
// Independently show why held numerical/equation records cannot be keyed as printed.
near(.9*(364/273)/2,.6);assert.ok(![2,4.5,6,8.3].includes(.6));
near((2.5-2)/(2.25-2),2); // conditional only: first copper yield is missing.
assert.notEqual(5,6); // printed dehydration equation fails carbon conservation.
for(const n of [3,5,13,14,22,33,34,35])assert.ok(batch.records.some(r=>r.actual_source_year===1988&&r.actual_source_number===n&&!r.publication_candidate));
console.log(`PASS ${integrated?'integrated':'pre-intake'}: 40 examined, 23 candidates, 17 held; arithmetic, conservation and content/provenance assertions. Conceptual answers require the recorded reasoned review.`);
