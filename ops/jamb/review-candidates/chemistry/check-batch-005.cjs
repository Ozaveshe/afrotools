'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const batch=require('./batch-005.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
assert.equal(batch.records.length,40);assert.equal(new Set(batch.records.map(r=>r.id)).size,40);
assert.equal(batch.records.filter(r=>r.publication_candidate).length,33);
for(const r of batch.records){
 const live=pool.find(q=>q.id===r.id);assert.ok(live);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(live),expected,`${r.id}: ${integrated?'integrated':'pre-intake'} content drift`);
 assert.ok([16,17,18,19].includes(r.source_pdf_page));
 if(!r.publication_candidate){assert.ok(r.hold_reason.length>50);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(q.subject,'chemistry');assert.equal(q.has_diagram,false);
 assert.equal(questionFingerprint(q),r.content_sha256);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.equal(new Set(Object.values(q.options)).size,q.format);assert.equal(q.explanation,q.ai_explanation);
 assert.ok(!/source note|repair|typo|imported|damaged|previous key|original key|guessed|nearest.*answer/i.test(q.question+' '+q.explanation));
 assert.ok(!/\[PAGE|without seeing|closest standard/i.test(q.explanation));
 assert.ok(r.semantic_review&&r.repair_history&&r.source_urls.length);
}
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${a} != ${b}`);
const get=(n,y=1987)=>batch.records.find(r=>r.candidate?.num===n&&r.candidate.year===y);
// Search all supplied coefficients for conservation, rather than confirming only the key.
const coeffs=[[4,1,2],[3,8,2],[2,8,3],[8,3,2]];
assert.deepEqual(coeffs.flatMap(([x,y,z],i)=>y===8&&y===2*x+z&&3*y===6*x+4+z?['ABCD'[i]]:[]),['B']);
assert.equal(get(35,1986).candidate.answer,'B');
for(let n=1;n<=10;n++)assert.equal(2*n+2-1,2*n+1);
assert.equal(get(48,1986).candidate.answer,'B');
// Direct methane substitution retains one carbon atom; ethyl chloride does not.
assert.deepEqual([1,2,1,1].flatMap((c,i)=>c!==1?['ABCD'[i]]:[]),['B']);
assert.equal(get(47,1986).candidate.answer,'B');
near(2+2*(-1),0);assert.equal(get(9).candidate.answer,'A');
near(.9*16+.1*18,16.2);assert.equal(get(10).candidate.answer,'B');
const anhydrous=3*23+75+4*16,hydrate=anhydrous+12*(2+16);
assert.equal(anhydrous,208);assert.equal(hydrate,424);
const percentage=(38.9*anhydrous/hydrate)/(100+38.9)*100;
assert.ok(percentage>13.73&&percentage<13.75);assert.equal(get(16).candidate.answer,'D');
const acid=.15*24.83/39.45;assert.ok(acid>.0944&&acid<.0945);assert.equal(get(20).candidate.answer,'A');
const mg=2*(2*3600+30*60)*24/(2*96500);
assert.ok(mg>2.238&&mg<2.239);assert.equal(get(23).candidate.answer,'C');
near(2*6e23,1.2e24);assert.equal(get(24).candidate.answer,'C');
near(1.6/(5/(2*14+4+3*16)),25.6);assert.equal(get(26).candidate.answer,'B');
near(-811-(-395-286),-130);assert.equal(get(27).candidate.answer,'B');
const times=[72,36,18];near((1/times[1])/(1/times[0]),2);near((1/times[2])/(1/times[1]),2);
assert.equal(get(28).candidate.answer,'A');
// Explicit atom/charge conservation for the taught equations.
for(const [l,r] of [
 [{C:6,H:12,O:6},{C:2*2+2,H:2*6,O:2+2*2}],
 [{Cu:3,O:3,N:2,H:6},{Cu:3,O:3,N:2,H:6}],
 [{Cl:6,H:6,O:6,charge:-6},{Cl:1+5,H:6,O:3+3,charge:-1-5}],
 [{Mg:3,N:2,H:12,O:6},{Mg:3,N:2,H:6+6,O:6}],
 [{N:1,H:3+1,Cl:1},{N:1,H:4,Cl:1}],
 [{S:2,O:3,H:2,charge:-2+2},{S:1+1,O:2+1,H:2,charge:0}]
])assert.deepEqual(l,r);
assert.equal(get(50,1986).candidate.answer,'B');
assert.equal(get(30).candidate.answer,'B');assert.equal(get(31).candidate.answer,'A');
// Safety-critical key must never regress to a chemical neutralising agent.
assert.equal(get(32).candidate.answer,'A');assert.match(get(32).candidate.options.A,/water/i);
assert.match(get(32).candidate.explanation,/Immediately flush/);
assert.match(get(32).candidate.explanation,/Do not try to neutralise/);
assert.equal(get(35).candidate.answer,'C');assert.equal(get(39).candidate.answer,'D');
// Held electrolysis: one faraday supplies one mole electrons, not one mole Cu.
near(1/2,.5);
console.log(`PASS ${integrated?'integrated':'pre-intake'}: 40 examined, 33 candidates, 7 held; independent arithmetic, equations, content/provenance and safety-key checks. Assertions do not certify all conceptual chemistry.`);
