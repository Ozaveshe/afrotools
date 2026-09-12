'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const draft=process.argv.includes('--draft'),root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/MATHEMATICS-JAMB-Past-Questions.pdf',sha='dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264';
function verify(records,pool) {
 assert.deepEqual(records.map(r=>r.candidate.num),[36,37,39,41,45,50]);
 if(fs.existsSync(pdf))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'),sha);else assert.ok(!draft,'Source PDF required before intake');
 for(const r of records){
  const q=pool.find(q=>q.id===r.id);assert.ok(q);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
  assert.equal(q.subject,'mathematics');assert.equal(q.year,1993);assert.equal(r.source_pdf_page,q.num===50?37:36);assert.equal(r.source_pdf_sha256,sha);assert.deepEqual(Object.keys(q.options),['A','B','C','D']);assert.equal(q.has_diagram,false);assert.ok(!q.image);assert.equal(q.explanation,q.ai_explanation);assert.deepEqual(q.verification,{method:'ai-calculation-checked',reviewed_at:'2026-09-12'});
  assert.doesNotMatch(q.question+' '+q.explanation,/repair|source note|inherited|original key|imported/i);
  let choices,valid;
  if(q.num===36){assert.match(q.question,/154 cm²/);assert.deepEqual(q.options,{A:'7.00 cm',B:'3.50 cm',C:'3.00 cm',D:'1.75 cm'});choices={A:7,B:3.5,C:3,D:1.75};valid=x=>Math.abs(4*(22/7)*x*x-154)<1e-10;}
  if(q.num===37){assert.match(q.question,/radius 3 m and angle 60°/);assert.deepEqual(q.options,{A:'4.0 m²',B:'4.1 m²',C:'4.7 m²',D:'5.0 m²'});choices={A:4,B:4.1,C:4.7,D:5};valid=x=>x===Math.round(Math.PI*9/6*10)/10;}
  if(q.num===39){assert.equal(q.question,'If sin θ = cos θ, find θ for 0° < θ < 360°.');assert.deepEqual(q.options,{A:'45°, 225°',B:'135°, 315°',C:'45°, 315°',D:'135°, 225°'});choices={A:[45,225],B:[135,315],C:[45,315],D:[135,225]};valid=xs=>xs.every(x=>Math.abs(Math.sin(x*Math.PI/180)-Math.cos(x*Math.PI/180))<1e-12);}
  if(q.num===41){assert.match(q.question,/30° each/);assert.match(q.question,/longest side is 10 cm/);assert.deepEqual(q.options,{A:'5 cm',B:'4 cm',C:'3√3 cm',D:'10√3/3 cm'});choices={A:5,B:4,C:3*Math.sqrt(3),D:10*Math.sqrt(3)/3};valid=a=>Math.abs(2*a*a-2*a*a*Math.cos(120*Math.PI/180)-100)<1e-10;assert.ok(r.repair_history.includes('denominator'));}
  if(q.num===45){assert.equal(q.question,'Estimate the mode of the grouped frequency distribution.');assert.equal(q.passage,'Weight of coconuts (g) | Frequency\n0–10 | 10\n10–20 | 27\n20–30 | 19\n30–40 | 6\n40–50 | 2');assert.deepEqual(q.options,{A:'13.2 g',B:'15.0 g',C:'16.8 g',D:'17.5 g'});const f=[10,27,19,6,2],k=f.indexOf(Math.max(...f)),a=f[k]-f[k-1],b=f[k]-f[k+1];choices={A:13.2,B:15,C:16.8,D:17.5};valid=x=>Math.abs(x-(k*10+10*a/(a+b)))<1e-12;}
  if(q.num===50){assert.equal(q.id,'mathematics-1994-50-5eb7725f06c0');assert.match(q.question,/Y and Z occur but X does not/);assert.deepEqual(q.options,{A:'1/8',B:'1/24',C:'1/12',D:'1/4'});choices={A:1/8,B:1/24,C:1/12,D:1/4};const outcomes=[];for(let x=0;x<2;x++)for(let y=0;y<3;y++)for(let z=0;z<4;z++)outcomes.push({X:x===0,Y:y<2,Z:z===0});const probability=outcomes.filter(o=>!o.X&&o.Y&&o.Z).length/outcomes.length;valid=x=>Math.abs(x-probability)<1e-12;}
  assert.ok(choices);assert.deepEqual(Object.entries(choices).filter(([,v])=>valid(v)).map(([key])=>key),[q.answer]);
 }
 return {passed:true,question_ids:records.map(r=>r.id),count:records.length};
}
if(require.main===module){const records=draft?require('./math-1993-002-candidates.json'):require('./math-1993-publishable-002.json').records;const pool=draft?records.map(r=>r.candidate):JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;console.log(JSON.stringify(verify(records,pool)));}
module.exports={verify};
