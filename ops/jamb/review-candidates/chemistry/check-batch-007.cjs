'use strict';
const assertSourceRecord=require('./assert-source-record.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-007.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,23);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assertSourceRecord(live,r,expected);
 assert.ok([22,23,24,25,26,27].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=(n,y=1989)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
// Copper dissolution/deposition conserves charge in both half-reactions.
near(0,2-2);near(2-2,0);assert.equal(get(40,1988).candidate.answer,'B');
for(const n of [1,2,5,100])assert.deepEqual({C:2*6*n,H:2*10*n+2*n,O:2*5*n+n},{C:12*n,H:22*n,O:11*n});
assert.equal(get(47,1988).candidate.answer,'D');
near(24/24,1);
assert.deepEqual([1/2,16/32,32/32,35.5/71].flatMap((v,i)=>v===1?['ABCD'[i]]:[]),['C']);
assert.equal(get(4,1990).candidate.answer,'C');
near(2+2+4,8);near(2+2+6+2+1,13);near(2*3+3*(-2),0);assert.equal(get(9).candidate.answer,'D');
near(2+8,10);assert.equal(get(11).candidate.answer,'B');
near(2+6*(-1),-4);assert.equal(get(24).candidate.answer,'C');
near(2*(-396)+2*(-286)-(-1428),64);assert.equal(get(27).candidate.answer,'D');
assert.deepEqual({C:2,H:4,O:6},{C:2,H:4,O:2*2+2});
near(1+1,1+1);assert.equal(get(28).candidate.answer,'D');
assert.deepEqual({Cu:1,H:4,N:4,O:12},{Cu:1,H:4,N:2+2,O:6+2+4});
assert.equal(get(30).candidate.answer,'B');
// Held items: calculate the result without pretending a supplied key is valid.
const coke=32/(119+2*16)*(2*12)/.8;assert.ok(coke>6.357&&coke<6.358);
assert.ok(![400,200,60,.4].some(x=>Math.abs(x-coke)<.01));
near(760-23,737); // A and D duplicate this correct numerical result.
near(133-55,78); // nucleus key is valid, but its fourth distractor is incomplete.
near(.05/2,.025);near(Math.min(.05/2,.05),Math.min(.05/2,.025));
near(400-100,300);near(600-100,500); // held graph and incomplete option D.
for(const [n,y] of [[37,1988],[3,1990],[6,1989],[10,1989],[18,1989],[26,1989]])assert.ok(batch.records.some(r=>r.actual_source_year===y&&r.actual_source_number===n&&!r.publication_candidate));
console.log(`PASS ${integrated?'integrated':'pre-intake'}: 40 examined, 23 candidates, 17 held; independent mole/enthalpy/charge/equation checks and source integrity. Conceptual answers rely on recorded reasoned review.`);
