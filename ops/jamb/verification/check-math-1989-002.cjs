'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const draft=process.argv.includes('--draft');
const root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const batch=draft?{records:require('./math-1989-002-updates.json')}:require('./math-1989-publishable-002.json');
const pool=draft?batch.records:require(path.join(root,'ops/jamb/source-pool.json')).questions;
assert.equal(batch.records.length,10);
function unique(q,values,valid){assert.deepEqual(values.flatMap((v,i)=>valid(v)?['ABCD'[i]]:[]),[q.answer]);}
function near(a,b){return Math.abs(a-b)<1e-9;}
for(const r of batch.records){
 const q=pool.find(q=>q.id===r.id);assert.ok(q);
 if(!draft){assert.equal(require(path.join(root,'scripts/lib/jamb-content-trust')).questionFingerprint(q),r.content_sha256);assert.equal(q.explanation,r.explanation);assert.equal(q.ai_explanation,r.explanation);}
 switch(q.num){
 case 15:{const rate=(9600-7400)/(30-20),fixed=7400-20*rate;assert.equal(fixed+30*rate,9600);unique(q,Object.values(q.options).map(v=>Math.round(Number(v.replace('₦',''))*100)),v=>v===fixed+15*rate);break;}
 case 20:{assert.deepEqual(Object.values(q.options),['x² + 2⁻¹x − 4⁻¹','x² − 2⁻¹x − 4⁻¹','x² + 2⁻¹x + 4⁻¹','x² + 2⁻¹x − 4⁻¹']);const terms=[[.5,-.25],[-.5,-.25],[.5,.25],[.5,-.25]];unique(q,terms,([b,c])=>[-4,-1,0,.25,1,4].every(x=>near((x-.5)*(x*x+b*x+c),x*x*x-.125)));break;}
 case 21:{const opts=[(a,b,c)=>4*a*(a-3*b)+(3*b-c)**2,(a,b,c)=>(2*a+3*b-c)*(2*a+3*b+c),(a,b,c)=>(2*a-3*b-c)*(2*a-3*b+c),(a,b,c)=>4*a*(a-3*b)+(3*b+c)**2];unique(q,opts,f=>[[1,2,3],[-2,3,-4],[4,-2,1],[0,2,5]].every(([a,b,c])=>f(a,b,c)===4*a*a+12*a*b-c*c+9*b*b));assert.equal(q.options[q.answer],'(2a + 3b − c)(2a + 3b + c)');break;}
 case 22:unique(q,[[-12,4.5],[-6,9],[6,9],[12,4.5]],([k,l])=>[[1,1],[2,3],[-2,5],[0,4]].every(([x,y])=>.5*(3*y-4*x)**2===8*x*x+k*x*y+l*y*y));assert.equal(q.options[q.answer],'(−12, 9/2)');break;
 case 23:unique(q,[[-1,2],[1,2],[2,1],[2,-1]],([x,y])=>2/x-3/y===4&&4/x+1/y===1);assert.equal(q.options[q.answer],'(2, −1)');break;
 case 24:{const values=Object.values(q.options).map(v=>{const[n,d]=v.split('/').map(Number);return n/d;});unique(q,values,v=>5*5-4*4*v===0);break;}
 case 25:{assert.deepEqual(Object.values(q.options),['r > abc/(bc + ac + ab)','r > abc','r > 1/a + 1/b + 1/c','r > 1/(abc)']);const candidates=[(a,b,c)=>a*b*c/(b*c+a*c+a*b),(a,b,c)=>a*b*c,(a,b,c)=>1/a+1/b+1/c,(a,b,c)=>1/(a*b*c)];unique(q,candidates,f=>[[2,3,4],[1,1,1],[3,5,7]].every(([a,b,c])=>near(f(a,b,c)/a+f(a,b,c)/b+f(a,b,c)/c,1)));break;}
 case 30:unique(q,[[1,10],[2,10],[3,13],[4,16]],([m,n])=>m+8===n-m&&n-m===19-n);assert.equal(q.options[q.answer],'(1, 10)');break;
 case 37:{const values=[Math.sqrt(3)/2,3*Math.sqrt(3)/2,3*Math.sqrt(3),2*Math.sqrt(3)];const longestSquared=3*3+3*3-2*3*3*Math.cos(120*Math.PI/180);unique(q,values,v=>near(v*v,longestSquared));assert.equal(q.options[q.answer],'3√3 cm');break;}
 case 41:{const rad=v=>v*Math.PI/180,functions=[Math.sin,Math.cos,Math.tan,x=>1/Math.tan(x)];const d35=10/Math.tan(rad(35)),d55=10/Math.tan(rad(55));unique(q,functions,f=>near(10*(f(rad(35))-f(rad(55))),d35-d55));assert.equal((d35-d55).toFixed(2),'7.28');assert.equal(q.options[q.answer],'10(cot 35° − cot 55°) km');break;}
 case 48:unique(q,Object.values(q.options).map(v=>parseInt(v,10)),age=>(240+age)/21===14);break;
 default:throw Error('No independent check '+q.id);
 }
}
console.log(JSON.stringify({passed:true,count:batch.records.length,question_ids:batch.records.map(r=>r.id)}));
