'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=require('./math-1986-publishable-003.json');
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
const near=(a,b)=>Math.abs(a-b)<1e-10;
const number=s=>{s=s.trim().replaceAll('−','-');if(s.includes('/')){const [a,b]=s.split('/').map(Number);return a/b;}return Number(s);};
const pairs=s=>[...s.matchAll(/\(([^,]+),\s*([^\)]+)\)/g)].map(m=>[number(m[1]),number(m[2])]);
const grid=[-3,-1,0,2,4];
assert.equal(batch.records.length,10);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);
 let valid;
 switch(q.num){
 case 9:{
  const rate=100*55/(150*5);assert.ok(near(150*rate*5/100,55));
  valid=([,v])=>near(Number(v.replace('%','').replace('⅓','.333333333333333').replace('½','.5')),rate);break;
 }
 case 11:valid=([,v])=>{const [[x,y]]=pairs(v);return x>y&&y>0&&x-y===6&&x*y===187;};break;
 case 19:{
  // Both sides are affine. Solve the zero of their difference and verify direction.
  const f=x=>(x+1)/3-1-(x+4)/5, slope=f(1)-f(0),bound=-f(0)/slope;
  assert.ok(slope>0);assert.ok(near(bound,11));
  valid=([,v])=>{const m=v.match(/^x\s*([<>])\s*(-?\d+)$/);return m&&m[1]==='>'&&near(Number(m[2]),bound);};break;
 }
 case 20:{
  const options={'(x + 2a)(x + 1)':(x,a)=>(x+2*a)*(x+1),'(x + 2a)(x − 1)':(x,a)=>(x+2*a)*(x-1),'(x² − 1)(x + a)':(x,a)=>(x*x-1)*(x+a),'(x + 2)(x + a)':(x,a)=>(x+2)*(x+a)};
  // Five distinct values per variable suffice for these polynomials of degree <=3.
  valid=([,v])=>{assert.ok(options[v]);return grid.every(x=>grid.every(a=>options[v](x,a)===x*x+2*a+a*x+2*x));};break;
 }
 case 23:valid=([,v])=>{const ps=pairs(v);return ps.length===3&&new Set(ps.map(p=>p.join(','))).size===3&&ps.every(([x,y])=>(x===0||y===0)&&near(y,-x*x+3*x+4));};break;
 case 24:{
  const options={'(a + 1)(a + 5)':a=>(a+1)*(a+5),'(a - 5)(7a - 1)':a=>(a-5)*(7*a-1),'(a + 5)(7a + 1)':a=>(a+5)*(7*a+1),'a(7a + 1)':a=>a*(7*a+1)};
  valid=([,v])=>{assert.ok(options[v]);return grid.every(a=>options[v](a)===(4*a+3)**2-(3*a-2)**2);};break;
 }
 case 30:valid=([,v])=>{const ps=pairs(v);return ps.length===2&&ps[0][0]!==ps[1][0]&&ps.every(([x,y])=>near(y,2*x+1)&&near(y,2*x*x+5*x-1));};break;
 case 32:{
  const options={'b²/a²':(a,b)=>b*b/(a*a),'a²/b²':(a,b)=>a*a/(b*b),'(a² + b²)/(b² − a²)':(a,b)=>(a*a+b*b)/(b*b-a*a),'(2a² + b²)/(a² + b²)':(a,b)=>(2*a*a+b*b)/(a*a+b*b)};
  valid=([,v])=>{assert.ok(options[v]);return [0.3,0.7,1.1,2.2].every(theta=>near(options[v](5*Math.cos(theta),5),1+(Math.sin(theta)/Math.cos(theta))**2));};break;
 }
 case 34:{
  const distance=50/Math.tan(Math.PI/6)+50/Math.tan(Math.PI/3);
  assert.equal(distance.toFixed(2),'115.47');valid=([,v])=>Number(v.replace(' m',''))===Number(distance.toFixed(2));break;
 }
 case 38:{
  const theta=8/6,area=theta/(2*Math.PI)*(Math.PI*6*6);assert.ok(near(area,24));
  valid=([,v])=>near(Number(v.replace(' cm²','').replace('⅓','.333333333333333')),area);break;
 }
 default:throw Error('Unexamined question '+q.num);
 }
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([k])=>k),[q.answer],q.id+' must have exactly one correct option');
}
console.log(JSON.stringify({passed:true,count:batch.records.length,question_ids:batch.records.map(r=>r.id)}));
