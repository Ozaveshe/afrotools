'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const {prepareBatch}=require('../ops/nigeria-exams/import-jamb-math-2021-batch-03.cjs');
const {verify,solveAnswers}=require('../ops/jamb/verification/check-mathematics-2021-003.cjs');
const {renderYear}=require('../scripts/build-jamb-reviewed-pages');
const manifest=require('../ops/nigeria-exams/jamb-math-2021-curated-batch-03.json'),pool=require('../ops/jamb/source-pool.json'),ledger=require('../data/jamb/review-ledger.json');
const ids=manifest.items.map(i=>'mathematics-2021-myschool-'+i.sourceItem);
test('four source-derived questions have independently calculated answers and frozen evidence',()=>{
 assert.deepEqual(solveAnswers(),{'60699':'D','60711':'B','60715':'B','60628':'D'});assert.equal(verify().accepted,4);
 const g=x=>x*x+3*x,x=1,difference=g(x+1)-g(x);assert.deepEqual([x+2,2*(x+2),2*x+1,x*x+4].map(v=>v===difference),[false,true,false,false]);
});
test('intake preserves every baseline question, review, source and hold',()=>{
 const base='d7680c772414f6cfb50714833398ce946d81f7f7',get=file=>JSON.parse(execFileSync('git',['show',base+':'+file],{encoding:'utf8',maxBuffer:32*1024*1024}));
 const oldPool=get('ops/jamb/source-pool.json'),oldLedger=get('data/jamb/review-ledger.json');
 assert.equal(pool.questions.filter(q=>oldPool.questions.some(old=>old.id===q.id)||ids.includes(q.id)).length,oldPool.questions.length+4);
 for(const q of oldPool.questions)assert.deepEqual(pool.questions.find(x=>x.id===q.id),q,q.id);
 for(const [id,q] of Object.entries(oldLedger.questions))assert.deepEqual(ledger.questions[id],q,id);
 for(const [id,s] of Object.entries(oldLedger.sources))assert.deepEqual(ledger.sources[id],s,id);
 const imported=prepareBatch(manifest,oldPool,oldLedger);
 assert.equal(imported.pool.questions.length,oldPool.questions.length+4);
 for(const id of ids){
  assert.deepEqual(pool.questions.find(q=>q.id===id),imported.pool.questions.find(q=>q.id===id),id);
  assert.deepEqual(ledger.questions[id],imported.ledger.questions[id],id);
  const source=imported.ledger.questions[id].source_id;assert.deepEqual(ledger.sources[source],imported.ledger.sources[source],source);
 }
 assert.deepEqual(ledger.publication_holds,oldLedger.publication_holds);
 assert.deepEqual(prepareBatch(manifest,pool,ledger).pool,pool);
 assert.deepEqual(prepareBatch(manifest,pool,ledger).ledger,ledger);
 const changed=structuredClone(manifest);changed.items[0].answer='A';assert.throws(()=>prepareBatch(changed,pool,ledger),/Frozen/);
});
test('verifier rejects content, options and source-trust changes for each item',()=>{
 for(const id of ids)for(const field of ['answer','question','explanation','options']){
  const changed=structuredClone(pool),q=changed.questions.find(q=>q.id===id);q[field]=field==='options'?{...q.options,A:'tampered'}:field==='answer'?'C':'tampered';assert.throws(()=>verify({pool:changed,ledger}));
 }
 const changed=structuredClone(ledger);changed.questions[ids[0]].content_sha256='0'.repeat(64);assert.throws(()=>verify({pool,ledger:changed}));
});
test('all original and new 2021 cards remain approved, with solutions collapsed',()=>{
 const page=renderYear('mathematics','2021',pool.questions,ledger,['2021']);
 const original=require('../ops/nigeria-exams/jamb-math-2021-curated-batch-01.json').items.map(i=>'mathematics-2021-myschool-'+i.sourceItem);
 for(const id of [...original,...ids]){
  assert.ok(page.approvedIds.includes(id),id);
  const card=page.html.match(new RegExp('<article[^>]+data-reviewed-question="'+id+'"[^>]*>([\\s\\S]*?)<\\/article>'));assert.ok(card,id);assert.match(card[1],/<details><summary>Answer and explanation<\/summary>/);assert.doesNotMatch(card[1],/<details\b[^>]*\bopen/);
 }
 assert.match(page.html,/original UTME sitting and question numbers are unconfirmed/i);
});
