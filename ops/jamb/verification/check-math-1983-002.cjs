'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
const batch=require('./math-1983-publishable-002.json');
const norm=text=>text.replace(/\s/g,'').replace(/[−–]/g,'-');
const numbers=text=>(norm(text).match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
const close=(a,b)=>Math.abs(a-b)<1e-9;
const checked=[];
function verify(num,accepts){const q=pool.find(q=>q.subject==='mathematics'&&q.year===1983&&q.num===num);const r=batch.records.find(r=>r.id===q.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.deepEqual(Object.entries(q.options).filter(([,v])=>accepts(v)).map(([k])=>k),[q.answer]);checked.push(q.id);}
verify(10,text=>{const [l,k]=numbers(text);return [-2,1].every(x=>close(l*x**3+2*k*x*x+24,0));});
const factors={
 '(3a+2b)(2a-3b)(9a²+4b²)':(a,b)=>(3*a+2*b)*(2*a-3*b)*(9*a*a+4*b*b),
 '(3a-2b)(2a-3b)(4a²-9b²)':(a,b)=>(3*a-2*b)*(2*a-3*b)*(4*a*a-9*b*b),
 '(3a-2b)(3a+2b)(9a²+4b²)':(a,b)=>(3*a-2*b)*(3*a+2*b)*(9*a*a+4*b*b),
 '(3a-2b)(2a-3b)(9a²+4b²)':(a,b)=>(3*a-2*b)*(2*a-3*b)*(9*a*a+4*b*b),
 '(3a-2b)(2a-3b)(9a²-4b²)':(a,b)=>(3*a-2*b)*(2*a-3*b)*(9*a*a-4*b*b)
};
verify(34,text=>{const f=factors[norm(text)];assert.ok(f);return [-3,-1,0,1,2,4].every(a=>[-2,0,1,3].every(b=>close(f(a,b),81*a**4-16*b**4)));});
const q=pool.find(q=>q.subject==='mathematics'&&q.year===1983&&q.num===48);
const data=numbers(q.question);
assert.deepEqual(data,[24.57,25.63,24.32,26.01,25.77]);
const mean=data.reduce((sum,n)=>sum+n,0)/data.length;
verify(48,text=>close(Number(text),mean));
assert.equal(checked.length,batch.records.length);
console.log(JSON.stringify({checked:checked.length,passed:true,question_ids:checked}));
