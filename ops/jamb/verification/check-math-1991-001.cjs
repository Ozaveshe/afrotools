'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const draft=process.argv.includes('--draft'),root=draft?'C:/Users/Oza/.codex/worktrees/three-area-integration-20260909/afrotools':path.resolve(__dirname,'../../..');
const records=draft?require('./math-1991-001-candidates.json'):require('./math-1991-publishable-001.json').records;
const pool=draft?records.map(r=>r.candidate):JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));assert.equal(records.length,5);
const near=(a,b)=>Math.abs(a-b)<1e-9;
for(const r of records){const q=pool.find(q=>q.id===r.id);assert.equal(questionFingerprint(q),r.content_sha256);assert.equal(q.year,1991);assert.equal(r.source_pdf_page,28);assert.equal(r.source_pdf_sha256,'dfc7168d207757e9db0b59b378aa16aa0f1449c501d6af3bf040abb37af95264');
 assert.doesNotMatch(q.explanation,/source note|repair|original key|rechecking/i);
 if(q.num===15){assert.equal(r.source_url,'https://myschool.ng/classroom/mathematics/60713');assert.deepEqual(q.options,{A:'uvw = 16(u + v)',B:'16uv = 3w(u + v)',C:'uvw = 12(u + v)',D:'12uvw = u + v'});const k=8*2*6/(2+6);assert.equal(k,12);const relations=[(u,v,w)=>near(u*v*w,16*(u+v)),(u,v,w)=>near(16*u*v,3*w*(u+v)),(u,v,w)=>near(u*v*w,12*(u+v)),(u,v,w)=>near(12*u*v*w,u+v)];assert.deepEqual(relations.flatMap((fn,i)=>[[2,6],[4,4],[3,9]].every(([u,v])=>fn(u,v,k*(u+v)/(u*v)))?['ABCD'[i]]:[]),[q.answer]);}
 else if(q.num===19){assert.deepEqual(q.options,{A:'p − s',B:'s − p',C:'r − p',D:'r + p'});const f=(r,s,t,p)=>r*s+t*r-p*t-p*s;for(const p of [-3,2,5])for(const s of [-2,4])for(const t of [1,7])assert.equal(f(p,s,t,p),0);assert.notEqual(f(3,2,4,2),0);assert.notEqual(f(-2,3,4,2),0);assert.equal(q.answer,'C');}
 else if(q.num===20){const answers=[[-1,5],[-5,1],[1,5],[1,1]];assert.deepEqual(q.options,{A:'−1 and 5',B:'−5 and 1',C:'1 and 5',D:'1 and 1'});assert.deepEqual(answers.flatMap((pair,i)=>new Set(pair).size===2&&pair.every(y=>{const x=(8-y)/3;return near(x*x+x*y,6);})?['ABCD'[i]]:[]),[q.answer]);}
 else if(q.num===21){const coefficient=1/2+1/3+1/4,threshold=1/coefficient;assert.ok(near(threshold,12/13));assert.deepEqual(q.options,{A:'x < 12/13',B:'x < 13',C:'x < 9',D:'x < 13/12'});assert.deepEqual([12/13,13,9,13/12].flatMap((v,i)=>near(v,threshold)?['ABCD'[i]]:[]),[q.answer]);for(const x of [-4,0,.9,1,8,12])assert.equal(coefficient*x<1,x<12/13);}
 else if(q.num===23){assert.deepEqual(q.options,{A:'2 and 3',B:'3 and 6',C:'−1 and 6',D:'1 and 6'});assert.deepEqual([[2,3],[3,6],[-1,6],[1,6]].flatMap((pair,i)=>pair.every(x=>(x-2)*(x-3)===12)?['ABCD'[i]]:[]),[q.answer]);}
 else throw Error('Unchecked question');
}
console.log(JSON.stringify({passed:true,question_ids:records.map(r=>r.id),count:records.length}));
