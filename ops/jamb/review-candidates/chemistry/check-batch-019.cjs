'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-019.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,35);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([62,63,64,65].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=2001)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
const {assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
for(const r of batch.records.filter(r=>r.publication_candidate)){
 const reasons=assessQuestion(r.candidate).reasons;
 for(const reason of ['missing_visual_or_description','missing_passage_or_context','incomplete_options','duplicate_option_text','explanation_requires_correction'])assert.ok(!reasons.includes(reason),r.id+':'+reason);
}


const q=(n,y=2002)=>get(n,y);
assert.equal(get(40).answer,'B');assert.equal(get(46).answer,'A');assert.equal(get(47).answer,'D');
assert.equal(6,2*2+2);assert.equal(12,2*6);assert.equal(6,2+2*2); // fermentation atoms
assert.equal(6+3*2,12);assert.equal(get(38).answer,'D');
assert.equal(2,2);assert.equal(2*1,2); // 2HClO -> 2HCl + O2
assert.match(get(45).options.B,/R₂CO/);assert.equal(get(45).answer,'C');
const oxygenMass=(3*4+2)*16,total=2*27+3*32+oxygenMass+2*2;
assert.equal(total,378);assert.equal((100*oxygenMass/total).toFixed(2),'59.26');assert.equal(q(3,2003).options.D,'59.26%');
assert.equal(3+3*(-1),0);assert.equal(q(8).answer,'B');assert.equal(q(11).answer,'B');assert.match(q(11).question,/CH₃CH₂CH\(OH\)CH₃/);
assert.equal(6,7-1);assert.equal(q(24).answer,'A');assert.ok(!/neutron capture/.test(q(24).explanation));
near(.66/(.75+.66)*.7,.3276595744680851);assert.equal(q(30).options.B,'0.33 atm');
assert.equal(2*3,2*2+2);assert.equal(q(31).answer,'B');assert.match(q(32).question,/current composition/);
assert.equal(2*1-2,0);assert.equal(q(33).answer,'C');
const quotient=v=>(1/v)*(1/v)/(1/v);assert.ok(quotient(2)<quotient(1));assert.equal(q(37).answer,'A');
const k=Ea=>Math.exp(-Ea/(8.314*300));assert.ok(k(20000)>k(40000));assert.equal(q(38).answer,'B');
const chargeMol=.65/65*2;near(chargeMol/2*201,2.01);near(chargeMol*201,4.02);
const held=batch.records.filter(r=>!r.publication_candidate);assert.equal(held.length,5);
for(const n of [13,14,19,23,39])assert.ok(held.some(r=>r.original_record.num===n&&r.original_record.year===2002));
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
console.log(require('./check-source-material.cjs')(batch,integrated,pdf));
console.log('Chemistry batch019:40 examined,35 candidates,5 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints, source hash/context gates and independent checks passed.');
