'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const batch=draft?{records:require('./math-1987-001-updates.json')}:require('./math-1987-publishable-001.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const numeric=v=>Number(v.replace(/[₦,%]/g,'').replace(/ (cm|kobo)$/,''));
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);
 if(!draft){assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);assert.equal(q.year,1987);}
 let valid;
 switch(q.num){
 case 2:{
  let minimum=1;while(minimum%40!==0||minimum%48!==0)minimum++;
  assert.equal(minimum,240);valid=([,v])=>numeric(v)===minimum;break;
 }
 case 6:{
  // Use integer percentage factors to avoid floating-point rounding.
  valid=([,v])=>{const [a,b]=v.split(':').map(Number);return a*100*100===b*120*80;};break;
 }
 case 7:{const profit=15000-5000,shares=[profit*2/5,profit*3/5];valid=([,v])=>numeric(v)===Math.abs(shares[1]-shares[0]);break;}
 case 8:{const annual=52*30,first=20*20+24*36;assert.equal(first,1264);valid=([,v])=>first+8*numeric(v)===annual;break;}
 case 10:{
  // Money expressed in kobo: cost*108/100=135.
  const cost=135*100/108,sale=110;assert.equal(cost,125);assert.ok(sale<cost);
  valid=([,v])=>numeric(v)*cost===(cost-sale)*100;assert.match(q.explanation,/12%/);assert.match(q.explanation,/loss/);break;
 }
 case 18:{const cost=n=>1500+50*n;valid=([,v])=>[0,1,7,100].every(n=>cost(n+1)-cost(n)===numeric(v));break;}
 case 21:{
  valid=([,v])=>{const values=v.replaceAll('−','-').split(',').map(Number);return values.length===2&&new Set(values).size===2&&values.every(m=>m+3===(m+1)**2);};
  for(const m of [-2,1])for(const x of [-3,0,2])assert.equal(x*x+2*(m+1)*x+m+3,(x+m+1)**2);break;
 }
 case 23:{
  valid=([,v])=>{const ys=v.replaceAll('−','-').split(',').map(Number);return ys.length===2&&new Set(ys).size===2&&ys.every(y=>(5-y)**2-2*y*y===1);};break;
 }
 case 26:{
  // Algebra gives -3x>9; test the open boundary and values on both sides.
  const predicates={'x > −3':x=>x>-3,'x < −3':x=>x<-3,'2 < x < 3':x=>x>2&&x<3,'−3 < x < −2':x=>x>-3&&x<-2};
  valid=([,v])=>{assert.ok(predicates[v]);return [-100,-4,-3.001,-3,-2.999,-2.5,-2,0,2.5,4,100].every(x=>predicates[v](x)===(x-1>4*(x+2)));};break;
 }
 default:throw Error('Unchecked question '+q.num);
 }
 assert.deepEqual(Object.entries(q.options).filter(valid).map(([key])=>key),[q.answer],q.id);
}
assert.equal(batch.records.length,9);
console.log(JSON.stringify({passed:true,count:batch.records.length,question_ids:batch.records.map(r=>r.id)}));
