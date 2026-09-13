const {test}=require('node:test');
const assert=require('node:assert/strict');
const bank=require('../assets/js/lib/ssce-practice-bank');
const find=id=>bank.questions.find(q=>q.id===id);
const selected=id=>find(id).options[find(id).answer];
test('every offered item has complete options, worked explanations and honest provenance',()=>{
  const ids=new Set();
  for(const q of bank.questions){
    assert.ok(!ids.has(q.id),q.id);ids.add(q.id);
    assert.ok(['Mathematics','English'].includes(q.subject));
    assert.ok(q.prompt.trim()&&q.topic.trim());
    assert.equal(q.options.length,4);assert.equal(new Set(q.options).size,4);
    assert.ok(q.options.every(s=>typeof s==='string'&&s.trim()));
    assert.ok(Number.isInteger(q.answer)&&q.answer>=0&&q.answer<4);
    assert.ok(q.steps.length>=2&&q.steps.every(s=>s.trim()));assert.ok(q.pitfall.trim());
    assert.equal(q.examYear,null);assert.equal(q.origin,'AfroTools original practice');
    if(q.passageId)assert.ok(bank.passages[q.passageId]?.text.length>100,q.id);
  }
  assert.equal(bank.questions.filter(q=>q.subject==='Mathematics').length,24);
  assert.equal(bank.questions.filter(q=>q.subject==='English').length,16);
});
test('numerical answers are independently recomputed from the problem data',()=>{
  const numeric={
    m1:240*(1-3/8),m2:18000/(1-0.10),m3:12000*3/(2+3),
    m10:Array.from({length:12},(_,i)=>5+3*i).at(-1),
    m11:Math.hypot(9,12),m12:10*Math.sin(Math.PI/6),
    m13:90/360*(22/7)*7**2,m14:80*50*40/1000,m15:360/(180-150),
    m16:(11-3)/(6-2),m17:[2,2,2,3,3,4,4,4,4,4].reduce((a,b)=>a+b)/10,
    m18:(6+8)/2,m20:40-(24+18-8),m21:50000*8/100*3,m23:Math.log10(0.001),m24:6*50000/100000
  };
  for(const [id,value] of Object.entries(numeric)){
    const text=selected(id).replace(/[₦,]/g,'').replace(/−/g,'-');
    assert.ok(Math.abs(parseFloat(text)-value)<1e-9,`${id}: ${text} vs ${value}`);
  }
  // Enumerate ordered draws, excluding the removed ball, instead of repeating the formula.
  const balls=['R','R','R','B','B'];let all=0,bothRed=0;
  balls.forEach((a,i)=>balls.forEach((b,j)=>{if(i!==j){all++;if(a==='R'&&b==='R')bothRed++;}}));
  const fraction=selected('m19').split('/').map(Number);
  assert.equal(fraction[0]/fraction[1],bothRed/all);
});
test('algebra and standard form have one valid choice under the stated conditions',()=>{
  const q4=find('m4'),forms=[[7.2,-4],[7.2,4],[72,-4],[0.72,-3]];
  assert.deepEqual(forms.map(([a,e],i)=>a>=1&&a<10&&Math.abs(a*10**e-0.00072)<1e-12?i:null).filter(i=>i!==null),[q4.answer]);
  const valid5=find('m5').options.map((s,i)=>({x:Number(s.split('=')[1]),i})).filter(({x})=>3*(2*x-1)===2*x+13);
  assert.deepEqual(valid5.map(v=>v.i),[find('m5').answer]);
  const valid6=find('m6').options.map((s,i)=>({y:Number(s),i})).filter(({y})=>2*(11-y)-y===7);
  assert.deepEqual(valid6.map(v=>v.i),[find('m6').answer]);
  const roots=[[-3,-4],[2,6],[3,4],[-2,-6]];
  assert.deepEqual(roots.map((pair,i)=>pair.every(x=>x*x-7*x+12===0)?i:null).filter(i=>i!==null),[find('m7').answer]);
  const expressions=[x=>x-3,x=>x+3,x=>x*x+3,()=>1];
  assert.deepEqual(expressions.map((fn,i)=>[-5,0,2,4,10].every(x=>Math.abs(fn(x)-(x*x-9)/(x-3))<1e-9)?i:null).filter(i=>i!==null),[find('m8').answer]);
  const radii=[a=>a/Math.PI,a=>a*a/Math.PI,a=>Math.sqrt(a/Math.PI),a=>Math.sqrt(a)/Math.PI];
  assert.deepEqual(radii.map((fn,i)=>[1,2,7,12].every(r=>Math.abs(fn(Math.PI*r*r)-r)<1e-9)?i:null).filter(i=>i!==null),[find('m9').answer]);
  const ranges=[x=>x>-3,x=>x<-3,x=>x<3,x=>x>3];
  assert.deepEqual(ranges.map((fn,i)=>[-10,-3.1,-3,-2.9,0,3,10].every(x=>fn(x)===(5-2*x>11))?i:null).filter(i=>i!==null),[find('m22').answer]);
});
