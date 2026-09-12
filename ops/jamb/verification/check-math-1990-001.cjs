'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1990-001-updates.json')}:require('./math-1990-publishable-001.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);
const keys={2:'A',3:'D',4:'A',5:'A',7:'B',17:'A',18:'A',21:'C',23:'A'};
assert.equal(batch.records.length,9);
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.equal(q.answer,keys[q.num]);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);}
 assert.doesNotMatch(q.explanation,/source note|repair|imported|original key/i);
 switch(q.num){
 case 2:
  assert.match(q.question,/a²bx \+ abx².*a²b − b³/);
  assert.equal(q.options.A,'b');
  for(const a of [-3,2,5])for(const b of [-2,1,4])for(const x of [1,3]){
   near(a*a*b*x+a*b*x*x,b*a*x*(a+x));near(a*a*b-b**3,b*(a-b)*(a+b));
  }
  // The remaining linear factors a, x, a+x and a-b, a+b are distinct
  // polynomials in independent indeterminates, hence share no further factor.
  break;
 case 3:assert.match(q.question,/241\.34 × \(3 × 10⁻³\)²/);assert.equal(Number((241.34*(3e-3)**2).toPrecision(4)),Number(q.options.D));break;
 case 4:assert.match(q.question,/₦100.*five years.*₦7\.50/);near(100*1.5*5/100,7.5);assert.equal(q.options.A,'1½%');break;
 case 5:assert.match(q.question,/¼.*¾ of the remainder/);near(1-1/4-(3/4)*(3/4),3/16);assert.equal(q.options.A,'3/16');break;
 case 7:assert.match(q.question,/⅓.*⅔ of the remainder.*₦12,000/);near(54000-54000/3-(54000*2/3)*2/3,12000);assert.equal(q.options.B,'₦54,000');break;
 case 17:
  assert.match(q.question,/a² \+ b² = 16.*2ab = 7/);assert.equal(q.options.A,'3 and −3');
  for(const d of [-3,3]){const a=(Math.sqrt(23)+d)/2,b=(Math.sqrt(23)-d)/2;near(a*a+b*b,16);near(2*a*b,7);near(a-b,d);}break;
 case 18:
  assert.match(q.question,/x³ − 2x² − 5x \+ 6.*x − 1/);assert.equal(q.options.A,'x² − x − 6');
  for(const x of [-7,-2,0,1,2,8])near((x-1)*(x*x-x-6),x**3-2*x*x-5*x+6);break;
 case 21:
  assert.match(q.question,/x − 8√x \+ 15 = 0/);assert.equal(q.options.C,'9 and 25');
  for(const x of [9,25])near(x-8*Math.sqrt(x)+15,0);
  for(const u of [0,1,3,5,10])near((u-3)*(u-5),u*u-8*u+15);break;
 case 23:assert.match(q.question,/24 m.*35 m².*shorter side/);near(2*(5+7),24);near(5*7,35);assert.equal(q.options.A,'5 m');break;
 default:throw Error('Unchecked record');
 }
}
console.log(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id),count:9}));
