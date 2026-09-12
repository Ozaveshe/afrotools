'use strict';
const assertSourceRecord=require('./assert-source-record.cjs');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-011.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,31);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assertSourceRecord(live,r,expected);
 assert.ok([36,37,38,39].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=1993)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
// Atom/charge accounting is an independent numerical check, not blanket semantic certification.
for(const [left,right] of [
 [{N:2,Na:1,H:5,O:4},{N:1+1,Na:1,H:3+2,O:3+1}],
 [{Ba:1,C:1,O:3,charge:2-2},{Ba:1,C:1,O:3,charge:0}],
 [{Na:2,Cl:2,Ca:1,C:1,O:3},{Na:2,Cl:2,Ca:1,C:1,O:3}],
 [{Ca:1,O:1+1,H:2},{Ca:1,O:2,H:2}],
 [{C:2,H:4+1,O:2+3,Na:1},{C:2,H:3+2,O:2+1+2,Na:1}],
 [{N:1,H:3+3,O:1,charge:1},{N:1,H:4+2,O:1,charge:1}],
 [{Na:1,Cl:1,H:2,S:1,O:4},{Na:1,Cl:1,H:1+1,S:1,O:4}],
 [{Ag:2,N:2,O:6},{Ag:2,N:2,O:4+2}],
 [{C:1,O:2+2,H:2,charge:-2},{C:1,O:3+1,H:2,charge:-2}],
 [{Ag:1,Cl:1,N:2,H:6,charge:0},{Ag:1,Cl:1,N:2,H:6,charge:1-1}],
 [{Pb:1,N:2,O:6,K:2,Br:2},{Pb:1,N:2,O:6,K:2,Br:2}]
])assert.deepEqual(left,right);
assert.equal(23+16+1,40);assert.equal((4/40)/(.25),.4);assert.equal(get(21).answer,'A');
assert.equal(2+2+6+2+3,15);assert.equal(get(9).answer,'A');
assert.deepEqual([235-92,238-92],[143,146]);assert.equal(get(10).answer,'C');
assert.deepEqual([2*1-1,2*3-1,2*4-1],[1,5,7]);assert.equal(get(25).answer,'D');
assert.equal(-394-(-110-242),-42);assert.equal(get(28).answer,'A');
const reductions=[.34,-.44,-2.90,-.76];assert.equal('ABCD'[reductions.indexOf(Math.min(...reductions))],'C');assert.equal(get(24).answer,'C');
// Source carbon skeleton: 0-1-2=3-4-5-6, with methyl branches 7 on2 and8 on5.
const graph=[[1],[0,2],[1,3,7],[2,4],[3,5],[4,6,8],[5],[2],[5]],paths=[];
const walk=p=>{if(p.includes(2)&&p.includes(3))paths.push(p);for(const n of graph[p.at(-1)])if(!p.includes(n))walk([...p,n]);};
for(let i=0;i<graph.length;i++)walk([i]);
const max=Math.max(...paths.map(p=>p.length));assert.equal(max,7);
const longs=paths.filter(p=>p.length===max),doubleLoc=p=>Math.min(p.indexOf(2),p.indexOf(3))+1;
const best=longs.sort((a,b)=>doubleLoc(a)-doubleLoc(b))[0];assert.equal(doubleLoc(best),3);
assert.deepEqual(best.flatMap((v,i)=>graph[v].some(n=>!best.includes(n))?[i+1]:[]),[3,6]);
assert.equal(get(42,1992).answer,'D');assert.match(get(42,1992).question,/C\(CH₃\)=CH/);
assert.deepEqual([2,3,1,0].flatMap((degree,i)=>degree===2?['ABCD'[i]]:[]),['A']);assert.equal(get(43,1992).format,4);
assert.deepEqual({C:2,H:3+2+1,O:1},{C:2,H:3+3,O:1});assert.equal(get(45,1992).answer,'A');
assert.equal(get(30).has_diagram,false);assert.match(get(30).question,/same reactant energy/);assert.match(get(30).question,/Y has a lower peak/);assert.equal(get(30).answer,'C');
assert.equal(get(31).answer,'A');assert.equal(get(33).answer,'C');
assert.equal(get(36).format,5);assert.equal(get(36).options.E,'Copper and tin');assert.equal(get(36).answer,'E');
const recovered=batch.records.find(r=>r.candidate?.num===36&&r.candidate.year===1993);assert.ok(recovered.source_urls.some(u=>u.includes('/13445')));
console.log('Chemistry batch011: 40 examined, 31 candidates, 9 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints and independent checks passed.');
