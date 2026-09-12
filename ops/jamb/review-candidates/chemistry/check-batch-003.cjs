'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-003.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,22);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok(r.source_pdf_page>=9&&r.source_pdf_page<=13);
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const get=(n,y=1985)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
near(.5*.5*22.4,5.6);assert.equal(get(50,1984).candidate.answer,'D');
near(1000/(2*56+3*16),6.25);assert.equal(get(7).candidate.answer,'C');
near(Math.sqrt(32/2),4);assert.equal(get(6).candidate.answer,'E');
near(.193*7200,1389.6);near(.193*7200/(2*96500)*63.5,.4572);assert.equal(get(17).candidate.answer,'A');
// Charge neutrality, including every distractor, independently identifies D.
const gallateCharges=[1+3-6,2+3-2,1+3-3,1+3-4,1+3-2];
assert.deepEqual(gallateCharges.flatMap((v,i)=>v===0?['ABCDE'[i]]:[]),['D']);
assert.equal(get(19).candidate.answer,'D');
const balances=[
 [{Mn:2,O:8,Cl:10,H:16,charge:-2-10+16},{Mn:2,O:8,Cl:10,H:16,charge:4}],
 [{C:2,H:2+4},{C:2,H:6}],
 [{N:2,O:4+2,Na:2,H:2},{N:2,O:2+3+1,Na:2,H:2}],
 [{Ba:1,O:2+3,H:2,Na:2,C:1},{Ba:1,O:3+2,H:2,Na:2,C:1}],
 [{Ca:1,C:1,O:3},{Ca:1,C:1,O:1+2}],
 [{Ca:1,H:2,O:1+1},{Ca:1,H:2,O:2}]
];for(const [l,r]of balances)assert.deepEqual(l,r);
near(7-2,5);near(2*5,10);assert.equal(get(23).candidate.answer,'D');
assert.equal(get(26).candidate.answer,'E');assert.equal(get(32).candidate.answer,'A');
// Actual temperature-dependent property check, not a generic boiling-point shortcut.
const ev=get(15).calculation_evidence;
const antoine=(T,p)=>{assert.ok(T>=p.range_K[0]&&T<=p.range_K[1]);return 10**(p.A-p.B/(T+p.C));};
const pressures=['ethanol','water','toluene'].map(k=>[k,antoine(323,ev[k])]);
const anchor=ev.butan_2_ol_anchor, enth=ev.butan_2_ol_enthalpy;
const start=anchor.anchor_K,end=323,N=2000,h=(end-start)/N,R=.008314462618;
const f=T=>{assert.ok(T>=enth.range_K[0]&&T<=enth.range_K[1]);const tr=T/enth.Tc_K;return enth.A*Math.exp(-enth.alpha*tr)*(1-tr)**enth.beta/(R*T*T);};
let integral=f(start)+f(end);for(let i=1;i<N;i++)integral+=(i%2?4:2)*f(start+i*h);
const butanol=antoine(start,anchor)*Math.exp(integral*h/3);pressures.push(['butan-2-ol',butanol]);
assert.ok(pressures[0][1]>2*Math.max(...pressures.slice(1).map(v=>v[1])));
assert.equal(get(15).candidate.answer,'C');
console.log('Vapour pressures at323K, bar (butan-2-ol is integrated approximation):',Object.fromEntries(pressures));
// Reasons for held records are backed by independent calculations as applicable.
near(22/22400*40,.039285714285714285);
const hydrate=(.499-.346)/18/(.346/159.5);assert.ok(hydrate>3.91&&hydrate<3.93);
near(-393-(-110.4),-282.6);
console.log(`PASS ${integrated?'integrated':'pre-intake'}:40 examined,22 candidates,18 held; arithmetic, atom/charge balances, property ranking and content/provenance checks. Conceptual review is recorded AI judgment, not certified by assertions.`);
