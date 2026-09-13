const {test}=require('node:test'),assert=require('node:assert/strict');
const api=require('../assets/js/lib/ssce-practice'),bank=require('../assets/js/lib/ssce-practice-bank');
test('checked answers cannot be changed and a retry has a separate score',()=>{
 let state=api.start(bank,'Mathematics','Statistics and probability');
 assert.throws(()=>api.advance(state,bank),/Check your answer/);
 const first=bank.questions.find(q=>q.id===state.ids[0]);
 state=api.answer(state,(first.answer+1)%4,bank);assert.throws(()=>api.answer(state,first.answer,bank),/already been checked/);
 state=api.advance(state,bank);
 while(state.index<state.ids.length){const q=bank.questions.find(q=>q.id===state.ids[state.index]);state=api.advance(api.answer(state,q.answer,bank),bank);}
 assert.equal(api.result(state,bank).correct,state.ids.length-1);
 const retry=api.retry(state,bank);assert.deepEqual(retry.ids,[first.id]);assert.equal(api.result(retry,bank).answered,0);
 assert.equal(api.normalize(JSON.parse(JSON.stringify(state)),bank).index,state.ids.length);
});
test('corrupt, foreign and fabricated progress is rejected before persistence',()=>{
 const valid=api.start(bank,'English','Comprehension');
 const bad=[{...valid,bankId:'old'},{...valid,ids:['missing']},{...valid,ids:[valid.ids[0],valid.ids[0]]},{...valid,index:1},{...valid,answers:{[valid.ids[0]]:4}},{...valid,answers:{[valid.ids[1]]:0}}];
 bad.forEach(value=>assert.throws(()=>api.normalize(value,bank)));
 assert.throws(()=>api.start(bank,'Physics',''),/available/);
});
test('reading reports include the complete passage once and preserve question context',()=>{
 let state=api.start(bank,'English','Comprehension');
 state=api.advance(api.answer(state,1,bank),bank);state=api.answer(state,2,bank);
 const report=api.report(state,bank),passage=bank.passages.library.text;
 assert.ok(report.includes(passage));assert.equal(report.split(passage).length-1,1);
 assert.ok(report.includes('Why did the volunteers propose longer library opening hours?'));
 assert.ok(report.includes('B. To give students access after lessons'));
 assert.ok(report.includes('Correct answer: She needed evidence that the service could be sustained'));
 assert.ok(!report.includes('What did the science club do'));
});
