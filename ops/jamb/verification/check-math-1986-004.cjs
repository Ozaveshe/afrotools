'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1986-publishable-004.json');
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
const updates=batch.records.map(r=>{const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);assert.ok(new URL(r.source_url).protocol==='https:');return q;});
const near=(a,b)=>Math.abs(a-b)<1e-9;
const grid=[-3,-1,0,1,3,5];
const rows=[];
for(const q of updates){
 let check;
 if(q.num===17){
  const choices={'(2a + 5x²)(4 + 25ax)':(a,x)=>(2*a+5*x*x)*(4+25*a*x),'a(2 + 5x)(4 − 10x + 25x²)':(a,x)=>a*(2+5*x)*(4-10*x+25*x*x),'(2a + 5x)(4 − 10ax + 25ax²)':(a,x)=>(2*a+5*x)*(4-10*a*x+25*a*x*x),'a(2 + 5x)(4 + 10ax + 25ax²)':(a,x)=>a*(2+5*x)*(4+10*a*x+25*a*x*x)};
  check=v=>{assert.ok(choices[v]);return grid.every(a=>grid.every(x=>choices[v](a,x)===8*a+125*a*x**3));};
 }else if(q.num===21){
  check=v=>{const m=v.match(/^x = −(\d+) ± (?:(\d+))?√(\d+)\/(\d+)$/);assert.ok(m);const c=-Number(m[1]),d=Number(m[2]||1)*Math.sqrt(Number(m[3]))/Number(m[4]);return [c-d,c+d].every(x=>near(3*x*x+6*x-2,0));};
 }else if(q.num===22){
  const choices={'12/(35x + 1)':x=>12/(35*x+1),'1/[35(x + 1)]':x=>1/(35*(x+1)),'12x/[35(x + 7)]':x=>12*x/(35*(x+7)),'12/(35x + 35)':x=>12/(35*x+35)};
  check=v=>{assert.ok(choices[v]);return [0,1,2,3,-3].every(x=>near(choices[v](x),1/(5*x+5)+1/(7*x+7)));};
 }else if(q.num===26){
  const choices={'2x/[(x − 2)(x + 2)(x² − 4)]':x=>2*x/((x-2)*(x+2)*(x*x-4)),'2x/(x² − 4)':x=>2*x/(x*x-4),'x/(x² − 4)':x=>x/(x*x-4),'4x/(x² − 4)':x=>4*x/(x*x-4)};
  check=v=>{assert.ok(choices[v]);return [-5,-3,-1,0,1,3,5].every(x=>near(choices[v](x),1/(x-2)+1/(x+2)+2*x/(x*x-4)));};
 }else if(q.num===27){
  const choices={'v = 12/(2S²)':(s,w)=>12/(2*s*s),'v = 12/(2S + w)':(s,w)=>12/(2*s+w),'v = 12/(2S² + w)':(s,w)=>12/(2*s*s+w),'v = 12/(2S²) + w':(s,w)=>12/(2*s*s)+w};
  check=v=>{assert.ok(choices[v]);return [1,2,3,5].every(s=>[1,2,4,7].every(w=>near(Math.sqrt(6/choices[v](s,w)-w/2),s)));};
 }else if(q.num===28){
  check=v=>v.replaceAll('−','-').split(' and ').map(Number).every(x=>near(16**x-5*4**x+4,0));
 }else throw Error('Unexpected draft question');
 const matches=Object.entries(q.options).filter(([,v])=>check(v)).map(([k])=>k);
 assert.deepEqual(matches,[q.answer]);rows.push({num:q.num,answer:q.answer,unique:true});
}
assert.equal(rows.length,6);
console.log(JSON.stringify({passed:true,count:rows.length,question_ids:updates.map(q=>q.id)}));
