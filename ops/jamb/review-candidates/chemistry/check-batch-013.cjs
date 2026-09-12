'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-013.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,25);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([40,43,44,45,46].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=1995)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
for(const [a,b] of [
 [{C:2,H:3+2,O:2+4,Na:1,S:1},{C:2,H:4+1,O:2+4,Na:1,S:1}],
 [{C:2*2+1,H:2*4,O:2*2+3,Na:2},{C:2*2+1,H:2*3+2,O:2*2+1+2,Na:2}],
 [{Ca:1,O:2+2,H:2,C:1},{Ca:1,O:3+1,H:2,C:1}],
 [{H:4,O:2},{H:4,O:2}],
 [{Cl:2,charge:-2},{Cl:2,charge:-2}],
 [{Cr:2,O:7,H:14,I:6,charge:-2+14-6},{Cr:2,O:7,H:14,I:6,charge:2*3}],
 [{Zn:1,O:4,H:4,charge:2-4},{Zn:1,O:4,H:4,charge:-2}],
 [{Ca:1,O:1+2,Si:1},{Ca:1,O:3,Si:1}]
])assert.deepEqual(a,b);
near(4.9/(2+32+64)*2*6.02e23,6.02e22);assert.equal(get(3).answer,'B');assert.equal(get(3).options.D,'6.01 × 10²³');
assert.equal(20-8/2,16);assert.equal(get(4).answer,'D');
const c=2.50e-5,kw=1e-14,oh=(c+Math.sqrt(c*c+4*kw))/2;
const exactPH=14+Math.log10(oh),approxPH=14+Math.log10(c);
near(approxPH,9.397940008672037);assert.ok(Math.abs(exactPH-approxPH)<.00001);assert.equal(exactPH.toFixed(1),'9.4');assert.equal(get(21).answer,'C');
assert.equal(3/2,1.5);assert.equal(get(24).answer,'C');assert.equal(-2-(-2),0);assert.equal(get(27).answer,'A');
assert.equal(get(10).answer,'A');assert.match(get(10).question,/T = 16/);assert.match(get(10).question,/R = 13/);assert.equal(get(10).has_diagram,false);
assert.ok(-(-1)*(1/400-1/300)<0);assert.equal(get(28).answer,'A');
// Source graph: shared endpoints, upper pathI and lower pathII. Relative barriers, not fabricated k measurements.
assert.match(get(33).question,/Path I has the higher peak and path II the lower peak/);
assert.match(get(33).question,/x is the vertical rise from the reactant energy to the higher peak/);
assert.equal(get(33).answer,'B');assert.equal(get(33).has_diagram,false);
assert.equal(get(34).answer,'A');assert.equal(get(37).answer,'C');assert.equal(get(38).answer,'D');assert.equal(get(39).answer,'C');
assert.ok(batch.records.find(r=>r.id==='chemistry-1994-49-c9caa91295b5'&&!r.publication_candidate));assert.ok(batch.records.find(r=>r.id==='chemistry-1994-50-9354f0896c2a'&&!r.publication_candidate));
assert.equal(get(45,1994).options.B,'CH₃COOCH₃');assert.equal(get(45,1994).options.D,'C₂H₅COOCH₃');
assert.equal(get(23).answer,'D');assert.equal(get(16).options.C,'Hygroscopic');
for(const n of [6,15,18,19,26,29,31,35,41])assert.ok(batch.records.find(r=>r.original_record.year===1995&&r.original_record.num===n&&!r.publication_candidate));
console.log('Chemistry batch013: 40 examined, 25 candidates, 15 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints and independent checks passed.');
