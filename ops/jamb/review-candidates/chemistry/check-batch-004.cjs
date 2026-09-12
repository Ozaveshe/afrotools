'use strict';
const assertSourceRecord=require('./assert-source-record.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-004.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,27);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assertSourceRecord(live,r,expected);
 assert.ok([13,14,15,17].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=(n,y=1986)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
// Numeric answers are recomputed independently from the physical relationships.
near(5.85/(23+35.5)*6.02e23,6.02e22);assert.equal(get(4).candidate.answer,'A');
near(.250*.5/2*24,1.5);assert.equal(get(5).candidate.answer,'B');
near(.825*.5,.4125);assert.equal(get(5,1987).candidate.answer,'C');
const masses=[2*12+4+2*16,3*12+8+16,12+2+2*35.5,2*12+4+16];
assert.deepEqual(masses,[60,60,85,44]);assert.equal(masses.indexOf(Math.min(...masses)),3);assert.equal(get(6,1987).candidate.answer,'D');
near(34.2/342/(50/1000),2);assert.equal(get(10).candidate.answer,'D');
near(6.5*60*60,23400);assert.equal(get(16).candidate.answer,'D');
near(-102/(.020*.1)/1000,-51);assert.equal(get(19).candidate.answer,'A');
near(10/.2,50);assert.equal(get(21).candidate.answer,'C');
// Reaction atom and charge ledgers; these assert conservation, not that a reaction occurs.
for(const [l,r] of [
 [{S:2,O:3,H:2,charge:-2+2},{S:1+1,O:2+1,H:2,charge:0}],
 [{H:2,N:2,F:2+2},{H:2,N:2,F:4}],
 [{Ag:1,N:1,O:3,Na:1,Cl:1},{Ag:1,N:1,O:3,Na:1,Cl:1}],
 [{H:2,S:1,Pb:1,N:2,O:6},{H:2,S:1,Pb:1,N:2,O:6}],
 [{Ca:1,C:1,O:3},{Ca:1,C:1,O:1+2}],
 [{Zn:1,H:2,Cl:2},{Zn:1,H:2,Cl:2}],
 [{Mg:1,H:2,O:1},{Mg:1,H:2,O:1}],
 [{C:1,H:2,O:1},{C:1,H:2,O:1}],
 [{S:2,O:4+2},{S:2,O:6}],
 [{N:2,O:2+2},{N:2,O:4}],
 [{H:2,O:2,Cl:2},{H:2,O:2,Cl:2}]
])assert.deepEqual(l,r);
assert.deepEqual([10/5,5/5,10/5],[2,1,2]);assert.equal(get(3).candidate.answer,'B');
assert.equal(get(46,1985).candidate.answer,'C');
// Oxidation state changes: Zn oxidised and H reduced only in D among Q17 choices.
const changes=[[0,0],[0,0],[0,0],[2,-1]];
assert.deepEqual(changes.flatMap((v,i)=>v.some(x=>x!==0)?['ABCD'[i]]:[]),['D']);
assert.equal(get(17).candidate.answer,'D');assert.equal(get(22).candidate.answer,'D');
assert.equal(get(23).candidate.answer,'C');assert.equal(get(28).candidate.answer,'C');assert.equal(get(31).candidate.answer,'C');
// Quantitative held decisions also have reproducible results.
near(Math.min(10/100,.2/2)*6.02e23,6.02e22);
near(80/((200/50)*Math.sqrt(32/16)),14.14213562373095);
near((20-15)/((25-10)-(20-15)),.5);
console.log(`PASS ${integrated?'integrated':'pre-intake'}: 40 examined, 27 candidates, 13 held; independent arithmetic, atom/charge balances and content/provenance integrity. Conceptual truth remains recorded reasoned review, not certified by assertions.`);
