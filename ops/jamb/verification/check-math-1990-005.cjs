'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const read=file=>JSON.parse(fs.readFileSync(file,'utf8').replace(/^\uFEFF/,''));
const records=draft?[31,34].map(n=>read(path.join(__dirname,'math-1990-figure'+n+'-candidate.json'))):require('./math-1990-publishable-005.json').records;
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pool=draft?records.map(r=>r.candidate):require(path.join(root,'ops/jamb/source-pool.json')).questions;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
assert.equal(records.length,2);
for(const r of records){
 const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);
 const file=draft?path.join(__dirname,r.asset_filename):path.join(root,q.image.slice(1));
 const bytes=fs.readFileSync(file),svg=bytes.toString('utf8');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.asset_sha256);
 assert.equal(q.image,'/assets/img/jamb/'+r.asset_sha256+'.svg');assert.equal(q.has_diagram,true);
 assert.equal(r.source_pdf_page,26);assert.equal(r.source_pdf_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');
 assert.doesNotMatch(q.explanation,/source note|repair|imported|original key/i);
 if(q.num===31){
  assert.match(svg,/M70 270 L170 65 L270 65 L370 270 Z/);
  near((270-170)/(370-70),1/3);
  assert.match(q.question,/73\.5 cm².*10\.5 cm.*one-third/);
  const choices=[21,17.5,14,10.5];
  assert.deepEqual(choices.flatMap((x,i)=>Math.abs(.5*(x+x/3)*10.5-73.5)<1e-10?['ABCD'[i]]:[]),[q.answer]);
  assert.equal(q.options.D,'10½ cm');
 }else if(q.num===34){
  assert.match(svg,/M270 40 L30 360 L270 360 Z M174 168 L270 240/);
  const X=[270,40],P=[174,168],Q=[270,240],Y=[270,360],Z=[30,360];
  const len=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])/40;
  const cosine=(a,b,c)=>{const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];return (u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v));};
  assert.deepEqual([len(X,P),len(X,Q),len(P,Q),len(Q,Y)],[4,5,3,3]);
  near(cosine(X,Q,P),cosine(X,Z,Y));near(len(X,Y)/len(X,P),2);near(len(Z,Y),6);
  assert.equal(q.options[q.answer],'6 cm');assert.match(q.explanation,/Q corresponding to Z and P corresponding to Y/);
 }else throw Error('Unchecked diagram');
}
console.log(JSON.stringify({passed:true,question_ids:records.map(r=>r.id),count:2}));
