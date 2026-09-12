'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8').replace(/^\uFEFF/,''));
const records=draft?[read(path.join(__dirname,'math-1990-figure40-candidate.json'))]:require('./math-1990-publishable-006.json').records;
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pool=draft?records.map(r=>r.candidate):require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(records.length,1);
for(const r of records){
 const q=pool.find(q=>q.id===r.id);assert.equal(q.id,'mathematics-1990-40-c0875fde314a');assert.equal(questionFingerprint(q),r.content_sha256);
 assert.equal(r.source_pdf_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');assert.equal(r.source_pdf_page,27);assert.equal(r.source_url,'https://myschool.ng/classroom/mathematics/32950');
 const file=draft?path.join(__dirname,r.asset_filename):path.join(root,q.image.slice(1));const bytes=fs.readFileSync(file),svg=bytes.toString('utf8');
 assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),r.asset_sha256);assert.equal(q.image,'/assets/img/jamb/'+r.asset_sha256+'.svg');assert.equal(q.has_diagram,true);
 const {X,Y,Z,pixels_per_cm:s}=r.geometry;assert.equal(s,30);
 assert.ok(svg.includes(`M${X[0]} ${X[1]} L${Y[0]} ${Y[1]} L${Z[0]} ${Z[1]} Z`));
 const length=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1])/s;
 const angle=(a,b,c)=>{const u=[a[0]-b[0],a[1]-b[1]],v=[c[0]-b[0],c[1]-b[1]];return Math.acos((u[0]*v[0]+u[1]*v[1])/(Math.hypot(...u)*Math.hypot(...v)))*180/Math.PI;};
 const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
 near(length(X,Y),8);near(angle(Y,X,Z),30);near(angle(X,Y,Z),105);near(angle(X,Z,Y),45);
 const result=8*Math.sin(Math.PI/6)/Math.sin(Math.PI/4);near(result,length(Y,Z));
 const options=[16,8,4,2].map(n=>n*Math.SQRT2);assert.deepEqual(options.flatMap((v,i)=>Math.abs(v-result)<1e-9?['ABCD'[i]]:[]),[q.answer]);
 assert.deepEqual(q.options,{A:'16√2 cm',B:'8√2 cm',C:'4√2 cm',D:'2√2 cm'});assert.match(q.explanation,/4√2 cm/);assert.doesNotMatch(q.explanation,/repair|source note|original key|rechecking/i);
}
console.log(JSON.stringify({passed:true,question_ids:records.map(r=>r.id),count:1}));
