'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const records=draft?require('./math-1992-002-candidates.json'):require('./math-1992-publishable-002.json').records;
const pool=draft?records.map(r=>r.candidate):JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const near=(a,b)=>Math.abs(a-b)<1e-8,letters='ABCD';
assert.deepEqual(records.map(r=>r.candidate.num),[21,26,27,30,31,33]);
for(const r of records){
 const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.year,1992);assert.equal(r.source_pdf_page,32);
 assert.equal(r.source_pdf_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');
 assert.equal(q.explanation,q.ai_explanation);assert.doesNotMatch(q.explanation,/source note|repair|original key|guessed/i);
 if(q.num===21){
  assert.match(q.question,/m\*n = mn \+ m \+ n/);assert.deepEqual(q.options,{A:'e = 1',B:'e = −1',C:'e = −2',D:'e = 0'});
  const op=(m,n)=>m*n+m+n;
  assert.deepEqual([1,-1,-2,0].flatMap((e,i)=>[-4,-1,0,2,7].every(m=>op(m,e)===m&&op(e,m)===m)?[letters[i]]:[]),[q.answer]);
 }else if(q.num===26){
  for(const phrase of ['endpoints of a diameter','Q is a point on the semicircle','PQ and QR are chords','S lies on PR','QS perpendicular to PR'])assert.ok(q.question.includes(phrase));
  assert.deepEqual(q.options,{A:'QS = PS × SR',B:'QS = √(PS × SR)',C:'QS = √2 × √(PS × SR)',D:'QS = (1/√2) × √(PS × SR)'});
  // Independent coordinates: diameter endpoints (-R,0),(R,0), Q=(x,sqrt(R²-x²)).
  const options=[(p,s)=>p*s,(p,s)=>Math.sqrt(p*s),(p,s)=>Math.sqrt(2*p*s),(p,s)=>Math.sqrt(p*s/2)];
  assert.deepEqual(options.flatMap((fn,i)=>[[5,3],[10,-6],[13,5]].every(([radius,x])=>near(fn(radius+x,radius-x),Math.sqrt(radius*radius-x*x)))?[letters[i]]:[]),[q.answer]);
 }else if(q.num===27){
  assert.equal(r.source_url,'https://myschool.ng/classroom/mathematics/31337');
  for(const phrase of ['60°N','20°E','25°W','along this latitude','6400 km'])assert.ok(q.question.includes(phrase));
  assert.deepEqual(q.options,{A:'800π/9 km',B:'800√(3π)/9 km',C:'800π km',D:'800√(3π) km'});
  const parallelRadius=6400*Math.cos(Math.PI/3),arc=(20+25)*Math.PI/180*parallelRadius;
  assert.ok(near(parallelRadius,3200));
  assert.deepEqual([800*Math.PI/9,800*Math.sqrt(3*Math.PI)/9,800*Math.PI,800*Math.sqrt(3*Math.PI)].flatMap((v,i)=>near(v,arc)?[letters[i]]:[]),[q.answer]);
 }else if(q.num===30){
  for(const phrase of ['perpendicular radii','6 cm','minor segment','quarter-circle arc'])assert.ok(q.question.includes(phrase));
  assert.deepEqual(q.options,{A:'9π cm²',B:'9(π − 2) cm²',C:'18π cm²',D:'36π cm²'});
  const radius=6,theta=Math.PI/2,segment=radius*radius*(theta-Math.sin(theta))/2;
  assert.deepEqual([9*Math.PI,9*(Math.PI-2),18*Math.PI,36*Math.PI].flatMap((v,i)=>near(v,segment)?[letters[i]]:[]),[q.answer]);
 }else if(q.num===31){
  assert.equal(q.question,'The locus of a point which is equidistant from two given fixed points is the');
  assert.equal(q.options.A,'perpendicular bisector of the straight line joining them');assert.equal(q.answer,'A');
  // Equidistance to (-3,0),(3,0) is exactly x=0, with arbitrary y.
  for(const x of [-4,-1,0,2,7])for(const y of [-5,0,9])assert.equal((x+3)**2+y*y===(x-3)**2+y*y,x===0);
 }else if(q.num===33){
  assert.equal(q.question,'Find the equation of the line through (5, 7) parallel to the line 7x + 5y = 12.');
  assert.deepEqual(q.options,{A:'5x + 7y = 120',B:'7x + 5y = 70',C:'x + y = 7',D:'15x + 17y = 90'});
  assert.deepEqual([[5,7,120],[7,5,70],[1,1,7],[15,17,90]].flatMap(([a,b,c],i)=>a*5+b*7===c&&a*5===b*7?[letters[i]]:[]),[q.answer]);
 }else throw Error('Unchecked question');
}
console.log(JSON.stringify({passed:true,count:records.length,question_ids:records.map(r=>r.id)}));
