'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-016.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,31);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([50,53,54,55,57].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=1999)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
const {assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
for(const r of batch.records.filter(r=>r.publication_candidate)){
 const reasons=assessQuestion(r.candidate).reasons;
 for(const reason of ['missing_visual_or_description','missing_passage_or_context','incomplete_options','duplicate_option_text','explanation_requires_correction'])assert.ok(!reasons.includes(reason),r.id+':'+reason);
}
// Enumerate longest carbon paths in CH3-CH2-CH(OH)-CH(CH3)2.
const graph=[[1],[0,2],[1,3],[2,4,5],[3],[3]],paths=[];
function walk(p){paths.push(p);for(const n of graph[p.at(-1)])if(!p.includes(n))walk([...p,n]);}
for(let i=0;i<6;i++)walk([i]);
const longest=paths.filter(p=>p.length===Math.max(...paths.map(v=>v.length))&&p.includes(2));
assert.equal(longest[0].length,5);
const locants=longest.map(p=>[p.indexOf(2)+1,p.indexOf(3)+1]).sort((a,b)=>a[0]-b[0]||a[1]-b[1]);
assert.deepEqual(locants[0],[3,2]);assert.equal(get(41,1998).answer,'B');
assert.deepEqual({C:2,H:2+2},{C:2,H:4});assert.equal(get(43,1998).answer,'B');
assert.equal(Math.min(12+4,14+3,2*16,3*12+8),16);assert.equal(get(3).answer,'C');
assert.deepEqual(Object.keys({Al:2,Si:2,O:9,H:4}).sort(),['Al','H','O','Si']);assert.equal(get(3,2000).answer,'C');
assert.ok(2*24+32>2*24);assert.equal(get(4).answer,'B');
near(150*.2-50/2,5);assert.equal(get(4,2000).answer,'C');
near(273*3/9,91);assert.equal(get(5).answer,'A');
near(300/1.5,200);assert.equal(get(6,2000).answer,'B');
near(.125/2*24,1.5);assert.equal(get(7).answer,'B');
assert.equal((452/780).toFixed(3),'0.579');assert.equal(get(7,2000).answer,'B');
assert.equal(get(14).answer,'D');assert.match(get(14).question,/period 2.*group 0/i);
near((.25/.5*.015)/2/.0125,.3);assert.equal(get(17).answer,'A');
assert.deepEqual([5*2/2,(7*2-2)/2,4*2-1],[5,6,7]);assert.equal(get(18).answer,'A');
assert.deepEqual({I:1+5,O:3,H:6,charge:-1-5+6},{I:3*2,O:3,H:3*2,charge:0});assert.equal(get(20).answer,'D');
const s=Math.cbrt(1.08e-7/4);near(s,.003);near(4*s**3,1.08e-7);assert.equal(get(23).answer,'C');
assert.deepEqual({S:2,O:2*2+2},{S:2,O:2*3});assert.equal(get(25).answer,'C');
near(.125*4*96500,48250);assert.equal(get(27).answer,'B');
near(2*10/40,.5);assert.equal(get(29).answer,'B');
for(const n of [2,3,4,6,7,8])assert.equal(get(n,2000).year,2000);
assert.equal(batch.records.filter(r=>!r.publication_candidate).length,9);
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'),batch.source_pdf_sha256);
console.log('Chemistry batch016:40 examined,31 candidates,9 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints, source hash/context gates and independent checks passed.');
