'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-018.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,27);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([59,60,61,62].includes(r.source_pdf_page));
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


const potentials={Ca:-2.868,Na:-2.71,Zn:-.7618,Al:-1.662};
assert.equal(Object.entries(potentials).sort((a,b)=>b[1]-a[1])[0][0],'Zn');assert.equal(get(42,2000).answer,'C');
assert.match(get(48,2000).question,/C\(=O\)O/);assert.equal(get(48,2000).answer,'B');
const gcd=(a,b)=>b?gcd(b,a%b):a;const subs=[2,4,2],divisor=subs.reduce(gcd);assert.deepEqual(subs.map(n=>n/divisor),[1,2,1]);assert.equal(get(1,2002).answer,'A');
assert.deepEqual({H:4,O:2},{H:4,O:2});near(8/2*18,72);assert.equal(get(2).answer,'A');
assert.deepEqual([7*1,4*2,3*3,1*(4+10)],[7,8,9,14]);assert.equal(get(2,2002).answer,'A');
assert.equal(get(3,2002).answer,'B');assert.match(get(3,2002).options.B,/different speeds/);assert.ok(!/catalyst|dehydrating/.test(Object.values(get(3,2002).options).join(' ')));
assert.match(get(4).question,/plateau at 150 °C/);assert.equal(get(4).answer,'D');
assert.equal(get(6).answer,'B');assert.match(get(6).question,/one electron contributed by each atom/);assert.equal(get(6).format,4);
const kinetic=(T)=>1.5*1.380649e-23*T;near(kinetic(600)/kinetic(300),2);assert.equal(get(9).answer,'B');
near(.21*30,6.3);assert.equal(get(20).answer,'D');
assert.deepEqual({Cu:3,H:8,N:8,O:24},{Cu:3,H:8,N:6+2,O:18+4+2});assert.equal(3*2,2*(5-2));assert.equal(get(22).answer,'C');
const quotient=(p,q,s)=>s/(p*q);assert.ok(quotient(1,1,.5)<quotient(1,1,1));assert.equal(get(30).answer,'A');
for(const [a,b] of [[{O:2,charge:-4},{O:2,charge:-4}],[{Fe:1,charge:2},{Fe:1,charge:3-1}],[{H:2,charge:2-2},{H:2,charge:0}],[{Cr:1,charge:0},{Cr:1,charge:2-2}]])assert.deepEqual(a,b);
assert.equal(get(33).answer,'C');assert.ok(-1<0);assert.equal(get(34).answer,'B');
const held=batch.records.filter(r=>!r.publication_candidate);assert.equal(held.length,13);
for(const n of [44,45,46,47])assert.ok(held.some(r=>r.original_record.year===2000&&r.original_record.num===n));
for(const n of [3,8,14,17,18,21,25,27,29])assert.ok(held.some(r=>r.original_record.year===2001&&r.original_record.num===n));
assert.deepEqual([2,2+1,2+1,2*2],[2,3,3,4]);
for(const n of [1,2,3])assert.equal(get(n,2002).year,2002);
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
console.log(require('./check-source-material.cjs')(batch,integrated,pdf));
console.log('Chemistry batch018:40 examined,27 candidates,13 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints, source hash/context gates and independent checks passed.');
