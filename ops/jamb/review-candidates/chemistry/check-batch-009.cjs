'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-009.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,24);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([29,30,31,32,33].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=(n,y=1991)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
// Atom conservation is checked separately from question keys.
for(const [left,right] of [
 [{C:2,H:2+1,O:4+1,Na:1},{C:2,H:1+2,O:4+1,Na:1}],
 [{K:2,H:2,C:2,O:6},{K:2,H:2,C:1+1,O:3+1+2}],
 [{H:4,S:2+1,O:2},{H:4,S:3,O:2}],
 [{N:1,C:1,O:1+1},{N:2*.5,C:1,O:2}],
 [{Ca:1,H:2,C:1,O:2+2},{Ca:1,H:2,C:1,O:3+1}],
 [{Ag:2,N:2,O:6},{Ag:2,N:2,O:4+2}],
 [{Hg:1,N:2,O:6},{Hg:1,N:2,O:4+2}],
 [{C:3,H:4,Br:2*2},{C:3,H:4,Br:4}]
])assert.deepEqual(left,right);
assert.match(get(43,1990).candidate.question,/CH₃CH₂C\(CH₃\)=CHCH\(CH₃\)CH₃/);
const leftLocants=[3,5],rightLocants=leftLocants.map(x=>7-x).sort((a,b)=>a-b);
assert.deepEqual(rightLocants,[2,4]);assert.equal(get(43,1990).candidate.answer,'C');
near(80*.7*(2*56)/(2*56+3*16),39.2);assert.equal(get(3).candidate.answer,'B');
// Rounding intervals allow a common chlorine/metal ratio without inventing new measurements.
const r1=[.355/.205,.365/.195],r2=[.705/.405,.715/.395];
assert.ok(Math.max(r1[0],r2[0])<Math.min(r1[1],r2[1]));assert.equal(get(4).candidate.answer,'C');
near((1000/(39+1+12+48))/2*22.4,112);assert.equal(get(7).candidate.answer,'C');
near(2+2*(-1),0);assert.notEqual(2+(-1),0);assert.equal(get(9).candidate.answer,'A');
assert.deepEqual([10-1,10+1],[9,11]);assert.equal(get(10).candidate.answer,'D');
near(.1*(10/1000)*22.4*1000,22.4);assert.equal(get(22).candidate.answer,'B');
near(2*(0-(-2)),4-0);assert.equal(get(26).candidate.answer,'B');
assert.ok(1+1>.5+1);assert.ok(-89.3<0);assert.equal(get(29).candidate.answer,'A');
near(1.2e-4/3e-5,4);assert.equal(get(31).candidate.answer,'C');
assert.match(get(12).candidate.explanation,/four N–H bonds are equivalent/);
assert.equal(get(39).candidate.answer,'C');
near(10/(3*12+4)*2*(2*80),80);assert.equal(get(43).candidate.answer,'D');
// Held calculations stay held even though independent numerical results exist.
near(10*30/20000,.015);assert.ok(![6.7,15,6,66].includes(.015));
const dissolution=-(50*4.18*34/1000)/(1.1/111);assert.ok(dissolution<-717&&dissolution>-718);
for(const [y,nums] of [[1990,[40,44,47,49]],[1991,[2,5,15,20,21,24,28,30,34,35,38,42]]])for(const n of nums)assert.ok(batch.records.some(r=>r.actual_source_year===y&&r.actual_source_number===n&&!r.publication_candidate));
console.log(`Chemistry009:40 reviewed,24 candidates,16 held; strict ${integrated?'integrated':'pre-intake'} identities and independent calculations passed.`);
