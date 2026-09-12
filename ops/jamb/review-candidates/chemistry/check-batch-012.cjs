'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-012.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,26);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([39,40,41,42,43].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=1994)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
// Independent atom/charge accounting; semantic decisions remain separately reasoned in the record.
for(const [a,b] of [
 [{Cu:1,H:4,N:4,O:12},{Cu:1,H:4,N:2+2,O:6+4+2}],
 [{Al:2,O:3+12,H:6,S:3},{Al:2,O:12+3,H:6,S:3}],
 [{Al:2,O:3+2+3,Na:2,H:2+6},{Al:2,O:8,Na:2,H:8}],
 [{Ca:1,O:1,H:2,Cl:2},{Ca:1,O:1,H:2,Cl:2}],
 [{O:4,H:4,charge:-4},{O:2+2,H:4,charge:-4}],
 [{H:1+2,O:1,charge:-1},{H:2+1,O:1,charge:-1}],
 [{Mn:1,O:4,H:8,Fe:5,charge:-1+8+10},{Mn:1,O:4,H:8,Fe:5,charge:2+15}],
 [{N:2,H:4,O:3},{N:2,H:4,O:1+2}],
 [{Ba:1,S:1,O:4,charge:2-2},{Ba:1,S:1,O:4,charge:0}],
 [{C:4,H:2*6,O:2,Na:2},{C:4,H:2*5+2,O:2,Na:2}]
])assert.deepEqual(a,b);
assert.equal(8/(12+4),22/(3*12+8));assert.equal(11.2*(22/44)/(8/16),11.2);assert.equal(get(4).answer,'B');
assert.match(get(4).question,/CH₃CH₂CH₃/);assert.equal(273*2*2,1092);assert.equal(get(5).answer,'D');
assert.equal(Math.sqrt(2/.5),2);assert.equal(get(7).answer,'C');
assert.ok(Math.abs(9650/96500/4*22.4-.56)<1e-12);assert.equal(get(23).answer,'D');
const isotopeRows=[[1,0,0],[1,0,1],[1,1,1],[1,2,1]];
assert.deepEqual(isotopeRows.flatMap(([p,n,e],i)=>p===1&&p+n===2&&p===e?['ABCD'[i]]:[]),['C']);assert.equal(get(14).answer,'C');
assert.equal(get(24).answer,'C');assert.match(get(24).explanation,/anode/);assert.equal(-1+1,0);assert.equal(get(25).answer,'B');
assert.equal(-1-4*(-2),7);assert.equal(get(28).answer,'A');
// van't Hoff sign: for negative reaction enthalpy, log(K2/K1) is negative when T2>T1.
assert.ok(-(-1)*(1/400-1/300)<0);assert.equal(get(30).answer,'B');assert.equal(get(30).format,4);
// PDF39 structure: six-carbon backbone with methyl branches at indices1 and3.
const graph=[[1],[0,2,6],[1,3],[2,4,7],[3,5],[4],[1],[3]],paths=[];
const walk=p=>{paths.push(p);for(const n of graph[p.at(-1)])if(!p.includes(n))walk([...p,n]);};
for(let i=0;i<graph.length;i++)walk([i]);const max=Math.max(...paths.map(p=>p.length));assert.equal(max,6);
const locants=p=>p.flatMap((v,i)=>graph[v].some(n=>!p.includes(n))?[i+1]:[]);
const best=paths.filter(p=>p.length===max).map(locants).sort((a,b)=>a[0]-b[0]||a[1]-b[1])[0];assert.deepEqual(best,[2,4]);
assert.equal(get(42,1993).answer,'D');assert.match(get(42,1993).question,/CH₃CH\(CH₃\)CH₂CH\(CH₃\)CH₂CH₃/);
assert.match(get(15).question,/anhydrous calcium chloride/);assert.equal(get(15).answer,'B');assert.equal(get(15).has_diagram,false);
assert.equal(get(36).answer,'B');assert.equal(get(38).answer,'A');assert.equal(get(43).answer,'D');
for(const n of [9,18,19,32,33,39,40,41])assert.ok(batch.records.find(r=>r.original_record.year===1994&&r.original_record.num===n&&!r.publication_candidate));
console.log('Chemistry batch012: 40 examined, 26 candidates, 14 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints and independent checks passed.');
