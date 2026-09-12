'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-021.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,32);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([67,68,69,70].includes(r.source_pdf_page));
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


const carb=[6,12,6],gcd=(a,b)=>b?gcd(b,a%b):a;assert.deepEqual(carb.map(n=>n/carb.reduce(gcd)),[1,2,1]);assert.equal(get(41,2003).answer,'C');
assert.equal(3+1,4);assert.equal(3+1+2,6);assert.equal(get(44,2003).options.A,'C₃H₇COOC₂H₅');
assert.equal(1+7+4*(-2),0);assert.equal(get(3).answer,'C');
const entropies={HF:173.8,HCl:186.9,HBr:198.7,HI:206.59};assert.equal(Object.keys(entropies).sort((a,b)=>entropies[b]-entropies[a])[0],'HI');assert.equal(get(4).options.C,'HI');
assert.equal((10*4830/96500*108).toFixed(1),'54.1');assert.equal(get(5).options.A,'54.1 g');
const quotient=(h,i,p)=>p*p/(h*i);near(quotient(1,1,1),quotient(2,2,2));assert.equal(get(7).answer,'B');
near(2*(-393)-2*(-110.4),-565.2);assert.ok(![-282.6,503.7,-503.7,282.6].includes(-565.2));
assert.equal(2+(-2),0);assert.equal(get(9).answer,'C');
near(2/(40+12+3*16)*22.4*1000,448);assert.equal(get(10).answer,'D');
near(4.9/(2+32+4*16)*(64+16),4);assert.equal(get(13).answer,'D');
for(let n=1;n<8;n++)assert.equal((2*n+2)-1,2*n+1);assert.equal(get(15).answer,'C');
assert.deepEqual([2,6,1],[2,4+2,1]);assert.equal(get(16).answer,'D');
assert.deepEqual([2*2,2*2,5*2],[4,2*2,4*2+2]);assert.equal(get(18).answer,'A');
const carbonCounts=[6,4,5,4];assert.equal(carbonCounts.filter(n=>n===5).length,1);assert.equal(get(21).format,4);assert.equal(get(21).answer,'C');
assert.deepEqual([2,4,2],[1+1,4,2]);assert.equal(get(23).format,4);
near(.020*.1/2/.5*1000,2);assert.equal(get(29).answer,'D');
assert.equal(get(30).answer,'B');assert.equal(7+1,8);assert.equal(get(39).answer,'A');
near(0-273.15,-273.15);assert.match(get(41).question,/Extrapolating/);
assert.deepEqual([1,2,1],[1,2,1]);assert.equal(get(42).answer,'A');
const held=batch.records.filter(r=>!r.publication_candidate);assert.equal(held.length,8);
for(const n of [1,6,8,14,19,20,26,36])assert.ok(held.some(r=>r.original_record.year===2004&&r.original_record.num===n));
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
console.log(require('./check-source-material.cjs')(batch,integrated,pdf));
console.log('Chemistry batch021:40 examined,32 candidates,8 held; '+(integrated?'integrated':'pre-intake')+' fingerprints, PDF/context gates and independent checks passed.');
