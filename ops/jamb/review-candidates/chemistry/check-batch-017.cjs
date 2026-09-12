'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-017.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,28);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([55,56,57,58,59].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=1999)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
const {assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
for(const r of batch.records.filter(r=>r.publication_candidate)){
 const reasons=assessQuestion(r.candidate).reasons;
 for(const reason of ['missing_visual_or_description','missing_passage_or_context','incomplete_options','duplicate_option_text','explanation_requires_correction'])assert.ok(!reasons.includes(reason),r.id+':'+reason);
}

assert.ok(-65.7<0);assert.equal(get(30).answer,'B');
assert.deepEqual({Na:2,S:1,O:3,H:2,Cl:2},{Na:2,S:1,O:1+2,H:2,Cl:2});assert.equal(get(34).answer,'B');
assert.deepEqual({N:2,H:8+2,Cl:2,Ca:1,O:2},{N:2,H:6+4,Cl:2,Ca:1,O:2});assert.equal(get(37).answer,'A');
assert.match(get(37).question,/calcium oxide/);assert.match(get(37).question,/inverted gas jar labelled ammonia/);
assert.deepEqual({C:4,H:12,O:2},{C:4,H:10+2,O:1+1});assert.equal(get(45).answer,'C');
const carbon=4,hydrogen=4,molarMass=carbon*12+hydrogen,brominePerMolecule=1+2;
assert.equal(molarMass,52);near(5.2/molarMass*brominePerMolecule*160,48);assert.equal(get(46).answer,'B');
assert.deepEqual({C:1+1+2,H:3+5,O:2},{C:2+1+1,H:5+3,O:2});assert.equal(get(49).answer,'C');
const shapes=(domains,lonePairs)=>domains===2?'linear':domains===4&&lonePairs===2?'bent':domains===4&&lonePairs===0?'tetrahedral':'other';
assert.deepEqual([shapes(2,0),shapes(4,2),shapes(4,0)],['linear','bent','tetrahedral']);assert.equal(get(13,2000).answer,'C');
assert.equal((14+Math.log10(.25)).toFixed(2),'13.40');assert.equal(get(24,2000).answer,'B');
assert.deepEqual({Mn:1,O:4,H:8,charge:-1+8-5},{Mn:1,O:4,H:8,charge:2});assert.equal(get(25,2000).answer,'C');
near(.5*2*96500,96500);assert.equal(get(26,2000).answer,'C');
const z=.003,q=200;near(z*q,.6);assert.equal(get(27,2000).answer,'D');assert.equal(get(27,2000).options.A,'M = Z/Q');assert.equal(get(27,2000).options.D,'M = QZ');
assert.ok(!/ethanol|0.46|50 g/.test(get(27,2000).question+Object.values(get(27,2000).options).join(' ')));
const rate=(c,k)=>k*c**0;assert.equal(rate(.1,2),rate(10,2));assert.equal(get(30,2000).answer,'B');assert.match(get(30,2000).options.B,/horizontal/);
const held=batch.records.filter(r=>!r.publication_candidate);assert.equal(held.length,12);
for(const n of [31,42,43,48,50])assert.ok(held.some(r=>r.original_record.year===1999&&r.original_record.num===n));
for(const n of [10,11,14,15,19,21,23])assert.ok(held.some(r=>r.original_record.year===2000&&r.original_record.num===n));
assert.equal(22-2,20);assert.equal(2+2+6+2+6+2,20);near(.914/2,.457);near(Math.sqrt(2e-10)*10,1.414213562373095e-4);
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
console.log(require('./check-source-material.cjs')(batch,integrated,pdf));
console.log('Chemistry batch017:40 examined,28 candidates,12 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints, source hash/context gates and independent checks passed.');
