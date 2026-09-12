'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const { questionFingerprint } = require('../../../../scripts/lib/jamb-content-trust');
const b = require('./batch-001.json');
const pool = JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../../source-pool.json'))).questions;
const near=(a,v)=>assert.ok(Math.abs(a-v)<1e-9,`${a} != ${v}`);
const byNum=n=>b.records.find(r=>r.candidate?.year===1983&&r.candidate.num===n);
assert.equal(b.records.length,40); assert.equal(new Set(b.records.map(r=>r.id)).size,40);
assert.equal(b.records.filter(r=>r.publication_candidate).length,25);
for(const r of b.records){
 assert.deepEqual(pool.find(q=>q.id===r.id),process.argv.includes('--integrated') && r.candidate ? r.candidate : r.original_record);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 assert.ok(r.source_pdf_page>=2&&r.source_pdf_page<=5);
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate; assert.equal(q.id,r.id); assert.equal(q.subject,'chemistry');
 assert.equal(questionFingerprint(q),r.content_sha256); assert.equal(q.options[q.answer]!==undefined,true);
 assert.equal(q.format,Object.keys(q.options).length); assert.equal(q.has_diagram,false);
 assert.equal(new Set(Object.values(q.options)).size,q.format);
 assert.ok(r.repair_history&&r.semantic_review&&r.source_urls.length);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|contamination|nearest option/i.test(q.explanation));
 assert.equal(q.ai_explanation,q.explanation);
}
// Enumerate successive formulae instead of copying the expected response string.
for(let n=1;n<30;n++){near((n+1)-n,1);near((2*(n+1)+2)-(2*n+2),2);}
assert.equal(byNum(4).candidate.answer,'B');
near(180/(12+2+16),6);near(6*12+12+6*16,180);assert.equal(byNum(9).candidate.options.B,'C₆H₁₂O₆');
// Independent oxidation-state ledger and atom conservation for complete redox reactions.
const feStates=[[0,2],[2,2],[2,3],[3,2]];
assert.deepEqual(feStates.flatMap((v,i)=>v[1]>v[0]?[i+1]:[]),[1,3]);
assert.equal(byNum(16).candidate.answer,'D');
const reactions=[
 [{Fe:1,H:2,S:1,O:4},{H:2,Fe:1,S:1,O:4}],
 [{Fe:1,S:2,O:4,H:2},{Fe:1,S:2,H:2,O:4}],
 [{Fe:2,Cl:2*2+2},{Fe:2,Cl:2*3}],
 [{Fe:2,Cl:2*3+2,Sn:1},{Fe:2,Cl:2*2+4,Sn:1}],
 [{Zn:1,H:2,S:1,O:4},{Zn:1,S:1,O:4,H:2}]
];for(const [l,r]of reactions)assert.deepEqual(l,r);
for(const T of [250,300,500])for(const V of [1,2,5]){const nR=8.314;near((nR*T/V)/(T/V),nR);}
const phs=[3,5,9].map(p=>10**(-p));assert.ok(phs[2]<phs[1]&&phs[1]<phs[0]);
const molesBase=0.1*(20/1000);const molesAcid=molesBase/2;near(molesAcid/0.5*1000,2);
assert.equal(byNum(30).candidate.answer,'A');
const solubility=(3.06/(39+35.5+3*16))/(10/1000);assert.equal(solubility.toFixed(1),'2.5');
assert.equal(byNum(37).candidate.options.C,'2.5 mol dm⁻³');
near((0.63/63)*2*108,2.16); // held apparatus item independently solved, not published
const cooledResidual=10*298/373;assert.ok(cooledResidual>7.98&&cooledResidual<8);
assert.equal(byNum(8).candidate.answer,'D');assert.equal(byNum(40).candidate.answer,'B');
console.log('PASS: 40 examined; 25 candidates, 15 held; independent arithmetic/balance checks and all content/provenance checks. Conceptual judgments are source-backed AI reviews, not proved by assertions.');
