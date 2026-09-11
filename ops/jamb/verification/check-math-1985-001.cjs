'use strict';
// Independent arithmetic checks for this exact, individually source-reviewed batch.
const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.resolve(__dirname,'../../..');
const {questionFingerprint}=require(path.join(root,'scripts/lib/jamb-content-trust'));
const pool=require(path.join(root,'ops/jamb/source-pool.json')).questions;
const batch=require('./math-1985-publishable-001.json');
const norm=s=>s.replace(/[−–]/g,'-').trim();
const numbers=s=>(norm(s).match(/-?\d+(?:\.\d+)?/g)||[]).map(Number);
const close=(a,b)=>Math.abs(a-b)<1e-9;
function fraction(s){
  s=norm(s);const m=s.match(/^(-?\d+)\s+(\d+)\/(\d+)$/);if(m)return Number(m[1])+Math.sign(Number(m[1]))*Number(m[2])/Number(m[3]);
  const f=s.match(/^(-?\d+)\/(\d+)$/);if(f)return Number(f[1])/Number(f[2]);
  assert.match(s,/^-?\d+(?:\.\d+)?$/);return Number(s);
}
const checked=[];
function verify(num, accepts){
  const record=batch.records.find(r=>r.num===num);assert.ok(record);
  const q=pool.find(q=>q.id===record.id);assert.equal(questionFingerprint(q),record.content_sha256);
  const matches=Object.entries(q.options).filter(([letter,text])=>accepts(text,letter)).map(([letter])=>letter);
  assert.deepEqual(matches,[q.answer],`Q${num} has exactly one independently computed matching option`);checked.push(q.id);
}
verify(1,text=>{const values=text.split('<').map(fraction);assert.equal(values.length,3);return values.every((v,i)=>i===0||values[i-1]<v);});
const rounded=Math.round((100+1/100+3/1000+27/10000)*100)/100;
verify(5,text=>close(fraction(text),rounded));
const nested=1/2+1/(2+1/(2-1/(4+1/5)));
verify(6,text=>close(fraction(text),nested));
verify(9,text=>{const x=numbers(text)[0];return close(2*x/3,(105+x/3)/4);});
verify(10,text=>close(Math.log(fraction(text))/Math.log(9),1.5));
verify(12,text=>{const value=fraction(text.split('=')[1].replace('naira','').trim());return close(.171*value,.225);});
verify(13,text=>{const p=numbers(text);return p.length===2&&p[0]!==p[1]&&p.every(v=>close((v-2)**2-4*(2*v+1),0));});
const b=(60-30)/(1/40-1/100),a=30-b/100;
assert.ok(close(a,10)&&close(b,2000));
verify(16,text=>close(numbers(text)[0],a+b/50));
const factors={
  A:x=>-(x-4)*(x+1)*(x-1)*(x-2),B:x=>(x-4)*(x-1)*(x-1)*(x+2),
  C:x=>-(x-2)*(x+1)*(x+2)*(x+4),D:x=>(x-4)*(x-3)*(x-2)*(x+1),E:x=>(x-2)*(x+2)*(x-1)*(x+1)
};
// Five distinct values establish equality of polynomials of degree at most four.
verify(17,(_,letter)=>[-3,-1,0,2,5].every(x=>close(factors[letter](x),9-(x*x-3*x-1)**2)));
const grouping={A:(a,b,x,y)=>(a*x-4)*(b*x-2*y),B:(a,b,x,y)=>(a*x+b)*(x-8*y),C:(a,b,x,y)=>(a*x-2*y)*(b*y-4),D:(a,b,x,y)=>(a*b*x-4)*(x-2*y),E:(a,b,x,y)=>(b*x-4)*(a*x-2*y)};
verify(19,(_,letter)=>[[2,3,5,7],[-1,4,2,3],[0,1,-2,4]].every(([a,b,x,y])=>close(grouping[letter](a,b,x,y),a*b*x*x+8*y-4*b*x-2*a*x*y)));
verify(21,text=>close(49-12*fraction(text),0));
verify(23,text=>{const n=numbers(text);return n.length===4&&n[0]!==n[2]&&[0,2].every(i=>close(2*n[i]+n[i+1],4)&&close(n[i]**2+n[i]*n[i+1],-12));});
verify(24,text=>{const [x,y]=text.split(',').map(v=>fraction(v.split('=')[1]));return close(2*x-3*y+10,5)&&close(10*x-6*y,5);});
verify(26,text=>close(fraction(text),(13**2+9**2-11**2)/(2*13*9)));
const table=pool.find(q=>q.id===batch.records.find(r=>r.num===28).id).passage.split('\n').slice(1).map(numbers);
assert.deepEqual(table,[[0,3],[1,5],[2,7],[3,4],[4,1],[5,0]],'Every source table value is preserved');
const count=table.reduce((s,r)=>s+r[1],0);assert.equal(count,20);
const mean=table.reduce((s,r)=>s+r[0]*r[1],0)/count;
const mode=table.filter(r=>r[1]===Math.max(...table.map(r=>r[1]))).map(r=>r[0]);assert.equal(mode.length,1);
verify(28,text=>{const n=numbers(text);return n.length===2&&close(n[0],mean)&&n[1]===mode[0];});
verify(31,text=>close(numbers(text)[0],351*(2/3)**3));
verify(32,text=>{const m=text.match(/^S(\d+)°([EW])$/);assert.ok(m);return (m[2]==='W'?180+Number(m[1]):180-Number(m[1]))===(72+180)%360;});
function prime(n){if(n<2)return false;for(let divisor=2;divisor*divisor<=n;divisor++)if(n%divisor===0)return false;return true;}
const outcomes=Array.from({length:10},(_,i)=>i+1).filter(n=>prime(n)||n%3===0);
assert.deepEqual(outcomes,[2,3,5,6,7,9]);
verify(35,text=>close(fraction(text),outcomes.length/10));
function radical(text){
  const s=text.replace(/\s*cm²$/,'').replace(/\s/g,'');
  if(!s.includes('√'))return fraction(s);
  const numeratorRadical=s.match(/^(\d*)√(\d+)(?:\/(\d+))?$/);
  if(numeratorRadical)return Number(numeratorRadical[1]||1)*Math.sqrt(Number(numeratorRadical[2]))/Number(numeratorRadical[3]||1);
  const denominatorRadical=s.match(/^(\d+)\/√(\d+)$/);assert.ok(denominatorRadical);
  return Number(denominatorRadical[1])/Math.sqrt(Number(denominatorRadical[2]));
}
verify(36,text=>close(radical(text),6*(8**2*Math.sqrt(3)/4)));
const theta=Math.acos(Math.sqrt(3)/2);
verify(38,text=>close(radical(text),(1/Math.tan(Math.PI/2-theta))/Math.sin(theta)**2));
const height=2*14/(4+3);
verify(42,text=>close(fraction(text),3*height/2));
assert.equal(checked.length,batch.records.length);
console.log(JSON.stringify({passed:true,count:checked.length,question_ids:checked}));
