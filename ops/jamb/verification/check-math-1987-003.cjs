'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1987-003-updates.json')}:require('./math-1987-publishable-003.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const area=ps=>Math.abs(ps.reduce((s,[x,y],i)=>{const [nx,ny]=ps[(i+1)%ps.length];return s+x*ny-y*nx;},0))/2;
const close=(a,b)=>Math.abs(a-b)<1e-7;
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);}
 const svg=q.num===4?'':fs.readFileSync(draft?__dirname+'/jamb-1987-'+q.num+'-draft.svg':path.join(root,q.image.slice(1)),'utf8');
 let valid;
 if(q.num===4){
  const values=[.02174,1.2047,.023789].map(n=>Number(n.toPrecision(2)));assert.deepEqual(values,[.022,1.2,.024]);
  valid=([,v])=>close(Number(v),values[0]*values[1]/values[2]);
 }else if(q.num===32){
  assert.ok(svg.includes('M 245 40 L 40 280 L 350 280 Z'));assert.ok(svg.includes('M 108.333333333 200 L 315 200'));
  const p=[245,40],t=[40,280],s=[350,280],qpoint=[108.333333333,200],rpoint=[315,200];
  assert.ok(close(qpoint[0],p[0]+(t[0]-p[0])*2/3));assert.ok(close(rpoint[0],p[0]+(s[0]-p[0])*2/3));
  const triangle=area([p,qpoint,rpoint]),trapezium=area([qpoint,rpoint,s,t]);
  valid=([,v])=>{const [a,b]=v.split(':').map(Number);return close(a/b,triangle/trapezium);};
 }else if(q.num===34){
  assert.ok(svg.includes('M 40 240 L 148 96 L 340 240 Z M 148 96 L 148 240'));
  const x=[40,240],y=[148,96],z=[340,240],t=[148,240],scale=12;
  assert.equal((x[0]-y[0])*(z[0]-y[0])+(x[1]-y[1])*(z[1]-y[1]),0);
  assert.equal((t[0]-x[0])/scale,9);assert.equal((z[0]-t[0])/scale,16);
  valid=([,v])=>close(Number(v.replace(' cm','')),Math.hypot(z[0]-y[0],z[1]-y[1])/scale);
 }else{
  assert.equal(q.num,37);assert.ok(svg.includes('M 95 270 L 95 30 L 255 30 L 255 270 L 223 270 L 223 62 L 127 62 L 127 270 Z'));
  const scale=16;assert.equal((127-95)/scale,2);assert.equal((255-223)/scale,2);assert.equal((62-30)/scale,2);
  assert.equal(area([[95,270],[95,30],[255,30],[255,270],[223,270],[223,62],[127,62],[127,270]])/scale**2,72);
  valid=([,v])=>{const h=Number(v.replace(' cm',''));return h>2&&6*h*h-(2*h-4)*(3*h-2)===72;};
 }
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([key])=>key),[q.answer],q.id);
}
assert.equal(batch.records.length,4);
if(!draft){const ids=batch.records.map(r=>r.id);assert.equal(require(path.join(root,'scripts/lib/jamb-visual-assets')).assertVisualAssetFiles(root,pool.filter(q=>ids.includes(q.id)),require(path.join(root,'data/jamb/review-ledger.json'))),3);}
console.log(JSON.stringify({passed:true,count:4,question_ids:batch.records.map(r=>r.id)}));
