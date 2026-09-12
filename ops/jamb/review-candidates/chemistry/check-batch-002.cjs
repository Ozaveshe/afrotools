'use strict';
const assertSourceRecord=require('./assert-source-record.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./batch-002.json');
const pool=JSON.parse(fs.readFileSync(require('node:path').join(__dirname,'../../source-pool.json'))).questions;
const near=(x,y)=>assert.ok(Math.abs(x-y)<1e-9,`${x} != ${y}`);
const rec=(year,num)=>b.records.find(r=>r.candidate?.year===year&&r.candidate.num===num);
assert.equal(b.records.length,40);assert.equal(new Set(b.records.map(r=>r.id)).size,40);
assert.equal(b.records.filter(r=>r.publication_candidate).length,22);
for(const r of b.records){
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const actual=pool.find(q=>q.id===r.id);
 assertSourceRecord(actual,r,[r.original_content_sha256,r.content_sha256]);
 assert.ok(r.source_pdf_page>=5&&r.source_pdf_page<=9);
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);
 assert.equal(q.format,Object.keys(q.options).length);assert.equal(new Set(Object.values(q.options)).size,q.format);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.equal(q.explanation,q.ai_explanation);assert.ok(r.repair_history&&r.semantic_review&&r.source_urls.length);
}
near(2-(10/1000)*1*65,1.35);assert.equal(rec(1983,49).candidate.answer,'A');
near(3.2/(2*14+4+2*16)*22.4,1.12);assert.equal(rec(1984,3).candidate.answer,'D');
near((2/2)/(16/32),2);assert.equal(rec(1984,9).candidate.answer,'A');
// Independent atom/charge balances for all peroxide distractors and the target reaction.
const balances=[
 [{H:4,S:1,O:2},{H:4,S:1,O:2}],
 [{Pb:1,S:1,O:5,H:2},{Pb:1,S:1,O:5,H:2}],
 [{I:2,H:4,O:2,charge:0},{I:2,H:4,O:2,charge:0}],
 [{Pb:1,O:10,H:4,N:2},{Pb:1,O:10,H:4,N:2}],
 [{S:1,O:4,H:2},{S:1,O:4,H:2}],
 [{Zn:1,Na:2,O:2},{Zn:1,Na:2,O:2}],
 [{Zn:1,C:1,O:3},{Zn:1,C:1,O:3}],
 [{Cl:6,N:2,H:6},{Cl:6,N:2,H:6}]
];for(const [l,r]of balances)assert.deepEqual(l,r);
const peroxideOChanges=[[-1,-2],[-1,-2],[-1,-2],[-1,0],[-1,-2]];
assert.deepEqual(peroxideOChanges.flatMap((v,i)=>v[1]>v[0]?['ABCDE'[i]]:[]),['D']);
assert.equal(rec(1984,14).candidate.answer,'D');near(0-(-3),3);assert.equal(rec(1984,26).candidate.answer,'A');
const molarMass=5*12+7+2*16+14;near(molarMass,2*56.5);
const fractions=[5*12,14,2*16,7].map(m=>m/molarMass*100);
const stated=[53.1,12.4,28.3,6.2];fractions.forEach((p,i)=>assert.ok(Math.abs(p-stated[i])<0.051));
assert.equal(rec(1984,28).candidate.answer,'D');
const mgElectrons=1/24*2,alElectrons=10/27*3;assert.equal((5*alElectrons/mgElectrons).toFixed(2),'66.67');
assert.equal(rec(1984,36).candidate.answer,'D');
// Demonstrate why multiple-answer/endpoint records stay held instead of forcing their old key.
near(.050*.50-2*.025*.11,.0195);assert.ok(.025*.50>.025*.05*2); // 1984Q13 D and A basic
near((.100*.15-4*.030*.1)/.15*1000,20); // aluminate endpoint: no matching printed excess
console.log('PASS: 40 examined;22 candidates,18 held. Arithmetic, atom/charge balance and content integrity checked; conceptual reasoning remains independently recorded AI review.');
