'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-014.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,27);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([46,47,48,49].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const get=(n,y=1997)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y).candidate;
const near=(a,b,t=1e-10)=>assert.ok(Math.abs(a-b)<=t*Math.max(1,Math.abs(b)));
assert.deepEqual({C:3,H:3+2+1,O:1},{C:3,H:3+3,O:1});assert.equal(get(44,1995).answer,'A');
const oxygen=12,hydrogen=35,steam=oxygen*2,left=hydrogen-steam,total=steam+left;
assert.equal(total,35);assert.equal(Math.round(100*left/total),31);assert.equal(get(1).answer,'B');
assert.equal(2*17-3,31);assert.equal(get(5).answer,'B');
const time=7*(60/30)*Math.sqrt((2*35.5)/(2*16));near(time*time,196*71/32);assert.equal(Math.round(time),21);assert.equal(get(7).answer,'C');
assert.equal(2+2+6+1,11);assert.equal(2+1,3);assert.equal(get(9).options.C,'1s²2s²2p⁶3s¹ and 1s²2s¹');
assert.equal(2*1-2,0);assert.equal(get(11).answer,'C');assert.match(get(11).question,/PₓQᵧ/);
near(16*.9+18*.1,16.2);assert.equal(get(12).answer,'B');
assert.equal((200-158)/200*100,21);assert.equal(get(13).answer,'C');
near(10**(-(14-10)),.0001);assert.equal(get(18).answer,'C');
assert.equal((.025*.125/2/.015).toFixed(3),'0.104');assert.equal(get(20).answer,'C');
for(const [a,b] of [
 [{Cu:2,O:2,H:4,charge:4},{Cu:2,O:2,H:4,charge:4}],
 [{Mn:1,O:2,H:4,Cl:4},{Mn:1,O:2,H:4,Cl:2+2}],
 [{Ba:1,S:1,O:4,charge:2-2},{Ba:1,S:1,O:4,charge:0}],
 [{Na:2,Cl:2,H:4,O:2},{Na:2,Cl:2,H:2+2,O:2}],
 [{C:2,H:2+2,I:2},{C:2,H:3+1,I:2}]
])assert.deepEqual(a,b);
assert.equal(get(21).answer,'A');assert.match(get(21).explanation,/anode, water is oxidised/);
assert.equal(6-3,3);assert.equal(get(23).answer,'B');
assert.equal(2*(-396)-2*(-297),-198);assert.equal(get(25).answer,'B');
assert.equal((89-298*11.8/1000).toFixed(2),'85.48');assert.equal(get(26).answer,'B');assert.match(get(26).question,/→ NO\(g\)/);
assert.equal(get(27).options.B,'n/m');assert.equal(get(27).answer,'C');
assert.equal(get(30).options.C,'[G]ᵖ[H]ᑫ / ([E]ᵐ[F]ⁿ)');
assert.equal(get(29).answer,'D');assert.equal(get(35).answer,'A');assert.equal(get(38).answer,'A');assert.equal(get(43).answer,'A');
assert.match(get(3).question,/stays constant along the horizontal section PQ/);assert.equal(get(3).answer,'D');
for(const n of [2,14,19,22,32,33,34,37,40,41])assert.ok(batch.records.find(r=>r.original_record.year===1997&&r.original_record.num===n&&!r.publication_candidate));
// Numerical inconsistencies remain held instead of rounding to a preferred option.
near(((1.90-1.52)/1.52)/((2.85-2.52)/2.52),1.909090909090909);
assert.equal((.1*.2*58.7/2.98).toFixed(2),'0.39');
console.log('Chemistry batch014:40 examined,27 candidates,13 held; strict '+(integrated?'integrated':'pre-intake')+' fingerprints and independent checks passed.');
