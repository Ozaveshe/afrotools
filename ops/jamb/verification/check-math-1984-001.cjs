'use strict';
// These checks cover this explicitly reviewed batch only.
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '../../..');
const { questionFingerprint } = require(path.join(root, 'scripts/lib/jamb-content-trust'));
const pool = require(path.join(root, 'ops/jamb/source-pool.json')).questions;
const batch = require('./math-1984-publishable-001.json');
const close = (a,b) => Math.abs(a-b) < 1e-9;
const normalized = text => text.replace(/\s/g,'').replace(/[−–]/g,'-');
const numbers = text => (normalized(text).match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
function fraction(text) {
  if (text.includes('½')) return 0.5;
  const n = numbers(text); return text.includes('/') ? n[0]/n[1] : n[0];
}
const checked=[];
function verify(num, accepts) {
  const q=pool.find(q=>q.subject==='mathematics'&&q.year===1984&&q.num===num);
  const record=batch.records.find(r=>r.id===q.id);
  assert.equal(questionFingerprint(q),record.content_sha256,`Q${num} matches reviewed content`);
  const matches=Object.entries(q.options).filter(([,v])=>accepts(v)).map(([k])=>k);
  assert.deepEqual(matches,[q.answer],`Q${num} has exactly one computed matching option`);
  checked.push(q.id);
}
verify(4,text=>close(numbers(text)[0]*1.10*0.95,209));
verify(5,text=>{const p=Number(text.replace('½','.5').replace(' kobo',''));return close(240/p-240/(p+0.5),16);});
const multiples=Array.from({length:300},(_,i)=>i+1).filter(n=>n%4===0).length;
verify(9,text=>close(fraction(text),multiples/300));
const log=(x,base)=>Math.log(x)/Math.log(base);
const logAnswer=(log(27,3)-log(64,1/4))/log(1/81,3);
verify(10,text=>close(fraction(text),logAnswer));
const factors={
 '2(x+3)(3x-2)':x=>2*(x+3)*(3*x-2),
 '6(x-2)(x+1)':x=>6*(x-2)*(x+1),
 '2(x-3)(3x+2)':x=>2*(x-3)*(3*x+2),
 '6(x+2)(x-1)':x=>6*(x+2)*(x-1),
 '(3x+4)(2x+3)':x=>(3*x+4)*(2*x+3)
};
verify(16,text=>{const f=factors[normalized(text)];assert.ok(f);return [-2,0,1,5].every(x=>close(f(x),6*x*x-14*x-12));});
const upper=(118-10)/6;
verify(19,text=>normalized(text)===`0<x<${upper}`);
const time=30;
assert.ok(close(1/time+1/(time+15),1/18));
const workEquations={
 'x²-5x-18=0':x=>x*x-5*x-18,
 'x²-20x+360=0':x=>x*x-20*x+360,
 'x²-21x-270=0':x=>x*x-21*x-270,
 '2x²+42x-190=0':x=>2*x*x+42*x-190,
 '3x²-31x+150=0':x=>3*x*x-31*x+150
};
verify(21,text=>{const f=workEquations[normalized(text)];assert.ok(f);return close(f(time),0);});
const radical=Math.sqrt(13);
const quadratics={
 'x²+(1-√13)x+1+√13=0':x=>x*x+(1-radical)*x+1+radical,
 'x²+(1-√13)x+1-√13=0':x=>x*x+(1-radical)*x+1-radical,
 'x²+2x+12=0':x=>x*x+2*x+12,
 'x²-2x+12=0':x=>x*x-2*x+12,
 'x²-2x-12=0':x=>x*x-2*x-12
};
verify(23,text=>{const f=quadratics[normalized(text)];assert.ok(f);return [1-radical,1+radical].every(x=>close(f(x),0));});
verify(29,text=>{const x=fraction(text);return x>8&&close((x*x+(x-4)**2-(x+4)**2)/(2*x*(x-4)),1/5);});
const integers=Array.from({length:101},(_,i)=>i-50).filter(x=>-3<2-5*x&&2-5*x<12);
verify(33,text=>JSON.stringify(numbers(text))===JSON.stringify(integers));
let doubles=0,total=0;
for(let a=1;a<=6;a++)for(let b=1;b<=6;b++){total++;if(a===b)doubles++;}
verify(40,text=>close(fraction(text),doubles/total));
const tableQuestion=pool.find(q=>q.subject==='mathematics'&&q.year===1984&&q.num===48);
const table=tableQuestion.passage.split('\n').slice(1).map(row=>(row.match(/\d+(?:\.\d+)?/g)||[]).map(Number));
assert.deepEqual(table,[[3.35,3.45,3],[3.45,3.55,6],[3.55,3.65,7],[3.65,3.75,4]],'Every source-table value is preserved');
const frequency=table.reduce((sum,row)=>sum+row[2],0);
assert.equal(frequency,20);
const mean=table.reduce((sum,[lower,upper,f])=>sum+(lower+upper)/2*f,0)/frequency;
verify(48,text=>close(fraction(text),mean));
assert.equal(checked.length,batch.records.length);
console.log(JSON.stringify({checked:checked.length,passed:true,question_ids:checked}));
