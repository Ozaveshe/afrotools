'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-010.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,27);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([33,34,35,36,37].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=(n,y=1992)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
// Independent atom and charge conservation, including the corrected redox equations.
for(const [left,right] of [
 [{C:2,H:4+2,O:1},{C:2,H:6,O:1}],
 [{C:2,H:4,O:2,Cl:2},{C:2,H:3+1,O:2,Cl:1+1}],
 [{K:2,Cl:2,O:2*3},{K:2,Cl:2,O:3*2}],
 [{H:3*2+2*3,S:3,O:3*4+2*3,Al:2},{H:6*2,S:3,O:6+12,Al:2}],
 [{Mn:1,O:2,Cl:2,H:4,charge:-2+4},{Mn:1,O:2,Cl:2,H:4,charge:2}],
 [{S:2*2,O:2*3,I:2,charge:2*(-2)},{S:4,O:6,I:2,charge:-2+2*(-1)}],
 [{H:4,O:2,charge:0},{H:4,O:2,charge:4-4}]
])assert.deepEqual(left,right);
assert.equal(get(44,1991).candidate.answer,'A');assert.equal(get(50,1991).candidate.answer,'A');
assert.match(get(48,1991).candidate.question,/CH₃CH\(CH₃\)CH₂Cl/);
// Carbon skeleton: parent path length3 with terminal chloro1 and branch methyl2.
const carbonGraph=[[1],[0,2,3],[1],[1]],paths=[];
const walk=(route)=>{paths.push(route);for(const next of carbonGraph[route.at(-1)])if(!route.includes(next))walk([...route,next]);};
for(let start=0;start<4;start++)walk([start]);
const longest=paths.filter(p=>p.length===Math.max(...paths.map(r=>r.length)));
assert.equal(longest[0].length,3);
const best=longest.filter(p=>p.includes(3)).sort((a,b)=>a.indexOf(3)-b.indexOf(3))[0];
assert.equal(best.indexOf(3)+1,1);assert.equal(best.indexOf(1)+1,2);
assert.equal(get(48,1991).candidate.answer,'B');
near(2.5*3/2,3.75);assert.equal(get(3,1993).candidate.answer,'C');
const coefficients=[[2,2,5,1],[3,2,5,2],[3,2,6,1],[2,2,6,2]];
const balances=([w,x,y,z])=>2*w+3*x===2*y&&w===3*z&&x===2*z&&4*w+3*x===y+12*z;
assert.deepEqual(coefficients.flatMap((v,i)=>balances(v)?['ABCD'[i]]:[]),['C']);
assert.equal(get(4).candidate.answer,'C');
const volume=1.5*(100+273.15)/(25+273.15);assert.ok(volume>1.877&&volume<1.878);
assert.equal(get(5,1993).candidate.answer,'A');
near(50*Math.sqrt(2/32),12.5);assert.equal(get(6).candidate.answer,'B');
assert.equal(get(7).candidate.options.D,'Temperature');
assert.deepEqual({protons:1,neutrons:3-1,electronsInNucleus:0},{protons:1,neutrons:2,electronsInNucleus:0});
assert.equal(get(9).candidate.answer,'C');assert.equal(get(9).candidate.options.C,'Two neutrons and one proton');
assert.deepEqual([17+1-14,8+1-7],[4,2]);assert.equal(get(11).candidate.answer,'B');
const sol=get(16);assert.ok(sol.id==='chemistry-1992-11-bd0f473e4a9a');assert.equal(sol.candidate.answer,'A');
near(.175*6*(2+32.06+64),102.963);assert.equal(get(21).candidate.answer,'B');
const mg=500*24*3600/(2*96500)*24/1000;assert.ok(mg>5.37&&mg<5.38);
assert.equal(get(23).candidate.answer,'B');
assert.deepEqual([2-4,0-(-1),1-1],[-2,1,0]);assert.equal(get(24).candidate.answer,'C');
assert.equal(get(25).candidate.answer,'B');
for(const k of [.1,2,37])near(k*(1/k),1);assert.equal(get(27).candidate.answer,'B');
const quotient=(p,q,r,s,x,y,m,n)=>r**m*s**n/(p**x*q**y);
near(quotient(2,3,4,5,1,1,2,1),80/6);
near(quotient(2*7,3*7,4*7,1,1,1,2,0),quotient(2,3,4,1,1,1,2,0));
assert.equal(get(28).candidate.answer,'A');assert.equal(get(29).candidate.answer,'C');
assert.equal(batch.records.filter(r=>r.actual_source_year===1991).length,6);
assert.equal(batch.records.filter(r=>r.actual_source_year===1992).length,29);
assert.equal(batch.records.filter(r=>r.actual_source_year===1993).length,5);
for(const r of batch.records.filter(r=>r.actual_source_year===1993)){assert.equal(r.source_pdf_page,37);assert.equal(r.original_record.year,1992);}
console.log(`Chemistry010:40 examined,27 candidates,13 held; strict ${integrated?'integrated':'pre-intake'} identities and calculations passed.`);
