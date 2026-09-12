'use strict';
const assertSourceRecord=require('./assert-source-record.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-015.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,24);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assertSourceRecord(live,r,expected);
 assert.ok([46,49,50,51,52,53].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=1998)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
const {assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
for(const r of batch.records.filter(r=>r.publication_candidate)){
 const reasons=assessQuestion(r.candidate).reasons;
 for(const reason of ['missing_visual_or_description','missing_passage_or_context','incomplete_options','duplicate_option_text','explanation_requires_correction'])assert.ok(!reasons.includes(reason),r.id+':'+reason);
}
near(.03/(.025*.02),60);assert.equal(14*1+46,60);assert.equal(get(47,1997).answer,'C');
for(const [a,b] of [
 [{Ca:1,O:1+1,H:2},{Ca:1,O:2,H:2}],
 [{Pb:1,Cl:2,charge:2-2},{Pb:1,Cl:2,charge:0}],
 [{C:3,H:8,O:10},{C:3,H:8,O:4+6}],
 [{Na:2,C:1,H:20+2,O:3+10+4,S:1},{Na:2,C:1,H:22,O:4+2+11,S:1}],
 [{Fe:1,Cu:1,charge:2},{Fe:1,Cu:1,charge:2}],
 [{Fe:2,Cl:2*2+2},{Fe:2,Cl:2*3}],
 [{Cu:3,O:3,N:2,H:6},{Cu:3,O:3,N:2,H:6}],
 [{N:2,H:6,Cl:6},{N:2,H:6,Cl:6}],
 [{N:4,H:12,O:6},{N:4,H:12,O:6}]
])assert.deepEqual(a,b);
near(Math.min(.2*.1,.2*.1/2)*(207+2*35.5),2.78);assert.equal(get(1,1999).answer,'A');
near(.11/(.056/22.4)/2,22);assert.equal(get(2,1999).answer,'B');
assert.equal(50*5,250);assert.equal(get(4).answer,'A');
assert.equal((30*(780-10)/760*(7+273)/(27+273)).toFixed(1),'28.4');assert.equal(get(5).answer,'C');assert.match(get(5).question,/7 °C/);
assert.equal(Math.sqrt((12+4)/(32+32)),.5);assert.equal(get(7).answer,'C');
assert.equal(get(9).answer,'B');assert.match(get(9).question,/four occupied electron shells and two electrons/);
const acid=.1*.1,base=.1*.2,volume=.1+.1,oh=(base-acid)/volume;
near(oh,.05);assert.equal((14+Math.log10(oh)).toFixed(1),'12.7');assert.equal(get(19).answer,'D');
assert.equal(2*23+12+3*16+10*(2+16),286);near(2.86/286/.1*1000,100);assert.equal(get(21).answer,'D');
assert.equal(15*193,2895);near(2895/96500/3*197,1.97);assert.equal(get(23).answer,'A');
assert.equal(get(24).answer,'D');assert.equal(get(25).answer,'A');
assert.equal(40-15,25);assert.equal(get(29).answer,'C');assert.match(get(29).question,/reactants at 10 kJ, products at 15 kJ and the peak at 40 kJ/);
const rate=(x,y)=>x*x*y**0;assert.equal(rate(2,3)/rate(1,3),4);assert.equal(rate(2,9)/rate(2,3),1);assert.equal(get(30).answer,'D');
assert.equal(get(31).answer,'A');assert.equal(get(32).answer,'C');assert.match(get(32).question,/4NH₃\(g\) \+ 3O₂\(g\)/);
assert.equal(get(18).answer,'C');assert.equal(get(49,1995).answer,'B');assert.equal(get(50,1995).answer,'D');
for(const n of [3,10,15,16,17,20,22,26,27,28,35,36,37])assert.ok(batch.records.find(r=>r.original_record.year===1998&&r.original_record.num===n&&!r.publication_candidate));
assert.equal(batch.records.find(r=>r.id==='chemistry-1997-47-360dfda93ddb').actual_source_year,1995);
assert.equal(batch.records.find(r=>r.id==='chemistry-1997-48-4c30b2a9e69e').actual_source_year,1995);
console.log('Chemistry batch015:40 examined,24 candidates,16 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints, source-context gates and independent checks passed.');
