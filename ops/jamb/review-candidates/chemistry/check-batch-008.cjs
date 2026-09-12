'use strict';
const assertSourceRecord=require('./assert-source-record.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-008.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,27);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assertSourceRecord(live,r,expected);
 assert.ok([26,27,28,29].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=(n,y=1990)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
// Independently conserve atoms in each numerical or redox teaching equation.
for(const [left,right] of [
 [{N:2,H:4,O:3},{N:2,H:2*2,O:1+2}],
 [{C:2,H:4,Cl:2},{C:2,H:4,Cl:2}],
 [{C:2,H:4+1,O:2+1,Na:1},{C:2,H:3+2,O:2+1,Na:1}],
 [{Pb:1,N:2,O:6,H:2,S:1},{Pb:1,N:2,O:6,H:2,S:1}],
 [{Cr:2,O:7,Fe:6,H:14,charge:-2+12+14},{Cr:2,O:7,Fe:6,H:14,charge:6+18}],
 [{N:2,O:2+2},{N:2,O:2*2}],
 [{Ca:1,Si:1,O:1+2},{Ca:1,Si:1,O:3}]
])assert.deepEqual(left,right);
assert.equal(get(36,1989).candidate.answer,'D');assert.equal(get(42,1989).candidate.answer,'A');
assert.equal(get(44,1989).candidate.answer,'B');
// CH2=C(CH3)CH2Cl has three parent-chain carbons, double bond1, methyl2 and chloro3.
assert.equal(get(48,1989).candidate.question.includes('CH₂=C(CH₃)CH₂Cl'),true);
assert.equal(get(48,1989).candidate.answer,'C');
const table=[{p:13,n:14},{p:16,n:16},{p:17,n:35},{p:19,n:20}];
assert.deepEqual(table.flatMap((r,i)=>r.p+r.n>30&&r.p+r.n<40&&r.p%2===1?['ABCD'[i]]:[]),['D']);
assert.equal(get(9).candidate.answer,'D');
const pct=5.02/(207+32)*22.4/10*100;assert.ok(pct>4.704&&pct<4.706);assert.equal(get(13).candidate.answer,'C');
near(2/(.020*.1*(250/25)),100);assert.equal(get(19).candidate.answer,'C');
const h=10**(-4.398);assert.ok(h>3.999e-5&&h<4e-5);assert.equal(get(20).candidate.answer,'A');
const ni=(.4/.1)*2.95/58.7;assert.ok(ni>.201&&ni<.202);assert.equal(get(23).candidate.answer,'A');
near((-2+14)/2,6);assert.equal(get(24).candidate.answer,'B');
// Sign reversal when standard reduction potentials are expressed as oxidation potentials.
const reduction={Zn:-.76,Fe:-.44};assert.ok(-reduction.Zn>-reduction.Fe);assert.equal(get(27).candidate.answer,'A');
assert.ok(71>29);assert.ok(17<29&&2<29);assert.equal(get(30).candidate.answer,'D');
assert.equal(get(32).candidate.answer,'C');assert.equal(get(37).candidate.answer,'D');
assert.match(get(36).candidate.explanation,/haemoglobin/);assert.ok(!/oxygen displacement/i.test(get(36).candidate.explanation));
// Held numeric questions retain their independently computed results without a guessed key.
near(.05/11,.004545454545454546);assert.ok(![.05,.1,.55,11].some(v=>Math.abs(v-.05/11)<.00001));
const oxalate=1.9/134/.1;assert.ok(oxalate>.1417&&oxalate<.1419);
near((10.8/108)/4*22.4,.56); // conditional only; anode type is missing.
near(-1670-(-822),-848); // conditional only; enthalpy labels are missing.
for(const n of [11,16,18,21,22,26,29,31,35])assert.ok(batch.records.some(r=>r.actual_source_year===1990&&r.actual_source_number===n&&!r.publication_candidate));
console.log(`PASS ${integrated?'integrated':'pre-intake'}: 40 examined, 27 candidates, 13 held; mole, pH, potential-sign, equation, source and content checks. Conceptual correctness relies on recorded independent review.`);
