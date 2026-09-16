const {test}=require('node:test'),assert=require('node:assert/strict');
const bank=require('../assets/js/lib/ssce-practice-bank'),api=require('../assets/js/lib/ssce-practice');
test('Physics numerical choices agree with independent energy and circuit calculations',()=>{
 const expected={p1:25*6,p2:2*3**2/2,p3:4*10*2,p4:900/15,p5:(6**2-2**2)/2,p6:0,p7:12/6,p8:8/0.4,p9:9/(3/0.5),p11:250*20/1000};
 for(const [id,value] of Object.entries(expected)){
  const q=bank.questions.find(q=>q.id===id);
  assert.equal(parseFloat(q.options[q.answer].replace(/,/g,'')),value,id);
  assert.equal(q.options.filter(s=>parseFloat(s.replace(/,/g,''))===value).length,1,id);
 }
 const unit=bank.questions.find(q=>q.id==='p10');assert.equal(unit.options[unit.answer],'Ohm');
 const ratio=bank.questions.find(q=>q.id==='p12');const [a,b]=ratio.options[ratio.answer].split(':').map(Number);assert.equal(a/b,(12/4)/(12/8));
});
test('Physics can be completed, retried and backed up using the shared practice workflow',()=>{
 let state=api.start(bank,'Physics','');assert.equal(state.ids.length,12);
 for(let i=0;i<12;i++){const q=bank.questions.find(q=>q.id===state.ids[state.index]);state=api.advance(api.answer(state,i===0?(q.answer+1)%4:q.answer,bank),bank);}
 assert.equal(api.result(state,bank).correct,11);assert.equal(api.retry(state,bank).ids.length,1);
 assert.deepEqual(api.normalize(JSON.parse(JSON.stringify(state)),bank),state);
 assert.match(api.report(state,bank),/^AfroTools Physics practice/);
});
