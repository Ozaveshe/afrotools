'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const {assertVisualAssetFiles}=require(path.join(root,'scripts/lib/jamb-visual-assets'));
const batch=require('./math-1986-publishable-005.json');
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
const close=(a,b)=>Math.abs(a-b)<1e-7;
const checked=[];
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);
 const svg=fs.readFileSync(path.join(root,q.image.slice(1)),'utf8');let result,parse;
 if(q.num===36){
  // Physical cross-section vertices (depth,height), projected into the drawing.
  const cross=[[0,6],[0,0],[12,0],[12,11]];
  const project=([depth,height],width=0)=>[190-17.5*width+15*depth,340-depth*100/12-height*18];
  assert.deepEqual(cross.map(v=>project(v)),[[190,232],[190,340],[370,240],[370,42]]);
  assert.ok(svg.includes('M 190 232 L 190 340 L 370 240 L 370 42 Z'));
  assert.deepEqual(project(cross[0],8),[50,232]);assert.ok(svg.includes('M 50 232 L 190 232 L 190 340 L 50 340 Z'));
  for(const label of ['6 m','8 m','12 m','11 m'])assert.ok(svg.includes('>'+label+'</text>'));
  // Shoelace area supplies an independent check of the trapezium formula.
  const twiceArea=cross.reduce((sum,[x,y],i)=>{const [nx,ny]=cross[(i+1)%cross.length];return sum+x*ny-y*nx;},0);
  result=Math.abs(twiceArea)/2*8;assert.equal(result,816);
  parse=v=>Number(v.replace(' m³',''));
 }else{
  assert.equal(q.num,39);const m=svg.match(/M 40 220 L ([\d.]+) ([\d.]+) L 340 220 Z/);assert.ok(m);
  const x=Number(m[1]),y=Number(m[2]);
  assert.ok(close(Math.hypot(x-40,y-220),200));assert.ok(close(Math.hypot(x-340,y-220),150));
  // 50 pixels per unit. Dot product at Z checks the same angle independently.
  result=((x-340)*(-300))/(Math.hypot(x-340,y-220)*300);
  assert.ok(close(result,29/36));
  for(const label of ['4','3','6'])assert.ok(svg.includes('>'+label+'</text>'));
  parse=v=>{const [a,b]=v.split('/').map(Number);return a/b;};
 }
 assert.deepEqual(Object.entries(q.options).filter(([,v])=>close(parse(v),result)).map(([k])=>k),[q.answer]);checked.push(q.id);
}
assert.equal(checked.length,2);
assert.equal(assertVisualAssetFiles(root,pool.filter(q=>checked.includes(q.id)),require(path.join(root,'data/jamb/review-ledger.json'))),2);
console.log(JSON.stringify({passed:true,count:checked.length,question_ids:checked}));
