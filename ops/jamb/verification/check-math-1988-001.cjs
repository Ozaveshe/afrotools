'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1988-001-updates.json')}:require('./math-1988-publishable-001.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const close=(a,b)=>Math.abs(a-b)<1e-10;
const fraction=v=>{const [a,b=1]=v.trim().replaceAll('−','-').split('/').map(Number);return a/b;};
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);assert.equal(q.year,1988);}
 let valid;
 switch(q.num){
 case 4:{assert.equal(24633/3060,8.05);valid=([,v])=>Number(v)===Math.round(24633*10/3060)/10;break;}
 case 5:{valid=([,v])=>Number(v.replace(/[₦,]/g,''))*(2/3)*(9/20)===720;break;}
 case 11:{
  const leaves=800/2,thickness=.018/leaves;assert.equal(leaves,400);
  const choices={'2.25 × 10⁻⁴ m':2.25e-4,'4.50 × 10⁻⁴ m':4.5e-4,'2.25 × 10⁻⁵ m':2.25e-5,'4.50 × 10⁻⁵ m':4.5e-5};
  valid=([,v])=>{assert.ok(Object.hasOwn(choices,v));return close(choices[v],thickness);};break;
 }
 case 14:{const k=Math.cbrt(8);valid=([,v])=>close(3*Math.cbrt(fraction(v)),k);break;}
 case 21:{valid=([,v])=>{const [x,y]=v.slice(1,-1).split(',').map(fraction);return close(3*x-5*y,3)&&close(2*y-6*x,-5);};break;}
 case 27:{
  const roots=[(2+Math.sqrt(8))/2,(2-Math.sqrt(8))/2],choices={'y = 1 − x':x=>1-x,'y = 1 + x':x=>1+x,'y = x − 1':x=>x-1,'y = 3x + 3':x=>3*x+3};
  valid=([,v])=>{assert.ok(choices[v]);return roots.every(x=>close(2+x-x*x,choices[v](x)));};break;
 }
 case 32:{
  const angles=[35,18,115],possible=angles.map((a,i)=>Number.isInteger(360/a)&&360/a>=3?i+1:0).filter(Boolean);
  assert.deepEqual(possible,[2]);const choices={'i and ii':[1,2],'ii only':[2],'ii and iii':[2,3],'iii only':[3]};
  valid=([,v])=>{assert.ok(choices[v]);return JSON.stringify(choices[v])===JSON.stringify(possible);};break;
 }
 case 39:{const height=2+14*Math.sqrt(3)*Math.tan(Math.PI/6),choices={'12 m':12,'14 m':14,'14√3 m':14*Math.sqrt(3),'16 m':16};valid=([,v])=>{assert.ok(choices[v]);return close(choices[v],height);};break;}
 case 44:{const volume=(Math.PI*6**2-Math.PI*5**2)*10;valid=([,v])=>{const m=v.match(/^(\d+)π cm³$/);assert.ok(m);return close(Number(m[1])*Math.PI,volume);};break;}
 case 48:{const values=[11,12,13,14,15,16,17,18,19,21],mean=values.reduce((a,b)=>a+b,0)/values.length,median=(values[4]+values[5])/2;assert.equal(mean,15.6);assert.equal(median,15.5);valid=([,v])=>Number(v)===Number((mean/median).toFixed(1));break;}
 case 49:{
  const pairs=[...q.question.matchAll(/\((\d+), (\d+)\)/g)].map(m=>[Number(m[1]),Number(m[2])]);assert.deepEqual(pairs,[[0,7],[1,11],[2,6],[3,7],[4,7],[5,5],[6,3]]);
  const values=pairs.flatMap(([score,n])=>Array(n).fill(score)),max=Math.max(...pairs.map(([,n])=>n)),modes=pairs.filter(([,n])=>n===max).map(([score])=>score);
  assert.equal(values.length,46);assert.deepEqual(modes,[1]);const median=(values[22]+values[23])/2;assert.equal(median,2);
  valid=([,v])=>v===`(${modes[0]}, ${median})`;break;
 }
 case 50:{let total=0,success=0;for(let a=1;a<=6;a++)for(let b=1;b<=6;b++){total++;if(a+b>=10)success++;}assert.equal(total,36);assert.equal(success,6);valid=([,v])=>fraction(v)===success/total;break;}
 default:throw Error('Unchecked question '+q.num);
 }
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([key])=>key),[q.answer],q.id);
}
assert.equal(batch.records.length,12);
console.log(JSON.stringify({passed:true,count:12,question_ids:batch.records.map(r=>r.id)}));
