const {test}=require('node:test');const assert=require('node:assert/strict');const api=require('../assets/js/lib/student-day');
test('a weekly plan uses real dates across month/year boundaries without duplicate imports',()=>{const input=[{id:'m1',day:'Monday',subject:'Mathematics'},{id:'s1',day:'Sunday',subject:'English'}];let state=api.plan(api.empty(),input,'2026-12-30',30);assert.deepEqual(state.tasks.map(t=>t.date),['2027-01-04','2027-01-03']);state=api.change(state,state.tasks[0].id,'done');const same=api.plan(state,input,'2026-12-30',30);assert.equal(same.tasks.length,2);assert.ok(same.tasks[0].doneAt);const next=api.plan(same,input,'2027-01-06',30);assert.equal(next.tasks.length,4);assert.equal(next.tasks[2].doneAt,null);});
test('reschedule, resume and completion persist independently of timezone and sorting',()=>{let state=api.plan(api.empty(),[{id:'m',day:'Monday',subject:'Biology'}],'2026-09-14',25);const id=state.tasks[0].id;state=api.change(state,id,'start');state=api.change(state,id,'move','2026-09-16');assert.equal(api.view(state,'2026-09-14').due.length,0);assert.equal(api.view(state,'2026-09-16').due.length,1);assert.equal(api.normalize(JSON.parse(JSON.stringify(state))).activeId,id);state=api.change(state,id,'done');assert.equal(state.activeId,null);assert.equal(api.view(state,'2026-09-16').completed.length,1);assert.equal(api.change(state,id,'undo').tasks[0].doneAt,null);});
test('invalid or oversized input cannot replace saved data',()=>{let raw=null;const storage={getItem:()=>raw,setItem:(k,v)=>{raw=v;}};const valid=api.plan(api.empty(),[{id:'a',day:'Monday',subject:'Physics'}],'2026-09-14',25);api.write(storage,valid);const before=raw;const invalid=JSON.parse(raw);invalid.tasks[0].date='2026-02-30';assert.throws(()=>api.write(storage,invalid));assert.equal(raw,before);assert.throws(()=>api.normalize({version:1,tasks:new Array(501).fill(valid.tasks[0])}));assert.throws(()=>api.change(valid,'missing','done'));});
test('storage failure is surfaced, not falsely reported as saved',()=>{assert.throws(()=>api.write({setItem(){throw Error('quota exceeded');}},api.empty()),/quota/);});

test('revision survives backup and movement with exact IDs and locale routes',()=>{
 for(const [locale,route] of Object.entries({en:'/tools/ssce-practice/',fr:'/fr/tools/pratique-waec-neco/',sw:'/sw/zana/mazoezi-waec-neco/'})){
  const revision={bankId:'ssce-foundations-2026-09',locale,ids:['m3','m1']};
  let state=api.scheduleRevision(api.empty(),revision,'Mathematics','2026-09-17');
  state=api.normalize(JSON.parse(JSON.stringify(state)));
  state=api.change(state,state.tasks[0].id,'move','2026-09-18');
  assert.deepEqual(state.tasks[0].revision,revision);
  assert.equal(api.revisionHref(state.tasks[0]),route+'#revision='+encodeURIComponent(state.tasks[0].id));
  revision.ids.push('m2');assert.equal(state.tasks[0].revision.ids.length,2);
 }
});
test('revision scheduling deduplicates identical pending work without dropping different missed questions or completed history',()=>{
 const r={bankId:'ssce-foundations-2026-09',locale:'en',ids:['m1']};
 let state=api.scheduleRevision(api.empty(),r,'Math','2026-09-17');
 state=api.scheduleRevision(state,r,'Math','2026-09-17');assert.equal(state.tasks.length,1);
 state=api.scheduleRevision(state,{...r,ids:['m2']},'Math','2026-09-17');assert.equal(state.tasks.length,2);
 state=api.change(state,state.tasks[0].id,'done');state=api.scheduleRevision(state,r,'Math','2026-09-17');
 assert.equal(state.tasks.length,3);assert.ok(state.tasks[0].doneAt);assert.equal(new Set(state.tasks.map(t=>t.id)).size,3);
});
test('invalid revision metadata is rejected before storage writes',()=>{
 const r={bankId:'ssce-foundations-2026-09',locale:'en',ids:['m1']};
 for(const invalid of [{...r,ids:[]},{...r,ids:['m1','m1']},{...r,ids:['../secret']},{...r,locale:'xx'},{...r,bankId:'https://example.com'}]){
  assert.throws(()=>api.scheduleRevision(api.empty(),invalid,'Math','2026-09-17'),/revision/);
 }
});
