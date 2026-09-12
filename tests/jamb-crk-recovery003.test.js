'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs');
const D='../ops/jamb/review-candidates/crk/',batch=require(D+'crk-recovery003.json'),recovery=require(D+'check-recovery-integrity.cjs');
const {fixtureLedger,verifyBatch}=require(D+'check-candidate-integrity.cjs'),{questionFingerprint:fp}=require('../scripts/lib/jamb-content-trust');
const path=require('node:path'),directory=path.resolve(__dirname,D),firstpass=fs.readdirSync(directory).filter(f=>/^crk-wave\d+\.json$/.test(f)).map(f=>require(path.join(directory,f)));
const allRecoveries=fs.readdirSync(directory).filter(f=>/^crk-recovery\d+\.json$/.test(f)).map(f=>require(path.join(directory,f))),recoveredRows=allRecoveries.flatMap(b=>b.records),examined=allRecoveries.reduce((n,b)=>n+b.examined_count,0);
const originalMap=new Map([...firstpass.flatMap(b=>b.records),...recoveredRows].map(r=>[r.id,r.original_record]));
const pool=require('../ops/jamb/source-pool.json').questions.map(q=>originalMap.get(q.id)||q),ledger=fixtureLedger(batch),map=new Map(batch.records.map(r=>[r.id,r.candidate])),after=pool.map(q=>map.get(q.id)||q);
test('CRK recovery validates original and exactly accepted held replacements without git',()=>{
 assert.deepEqual(recovery.verify(pool),{passed:true,examined,recovered:recoveredRows.length,still_held:examined-recoveredRows.length,integrated:0});
 assert.equal(recovery.verify(after,ledger).integrated,batch.records.length);
 assert.equal(require(D+'check-firstpass-coverage.cjs').verify(after,ledger).held,215);
 for(const entry of batch.records){const first=require(D+entry.firstpass_file),pins=Object.fromEntries(first.records.map(r=>[r.id,{answer:r.candidate.answer,year:r.candidate.year,num:r.candidate.num,content_sha256:r.content_sha256}]));assert.equal(verifyBatch(first,pins,after,false,ledger).passed,true);}
 const allMap=new Map([...firstpass.flatMap(b=>b.records),...recoveredRows].map(r=>[r.id,r.candidate])),allLedger=structuredClone(ledger);
 for(const b of [...firstpass,...allRecoveries])Object.assign(allLedger.questions,fixtureLedger(b).questions);
 const allAfter=pool.map(q=>allMap.get(q.id)||q);assert.equal(require(D+'check-firstpass-coverage.cjs').verify(allAfter,allLedger).examined,1020);assert.equal(recovery.verify(allAfter,allLedger).integrated,recoveredRows.length);
});
test('CRK recovery rejects unknown current content, forged ledger, and unrecovered held mutation',()=>{
 const id=batch.records[0].id,held=batch.held_records[0].id;
 assert.throws(()=>recovery.verify(after,{}));
 for(const change of [l=>l.questions[id].content_sha256='forged',l=>l.questions[id].answer_review.status='pending',l=>l.sources[batch.source_id].content_sha256='forged',l=>l.sources[batch.source_id].source_file='wrong.pdf']){
  const bad=structuredClone(ledger);change(bad);assert.throws(()=>recovery.verify(after,bad));assert.throws(()=>require(D+'check-firstpass-coverage.cjs').verify(after,bad));
 }
 for(const target of [id,held]){const bad=after.map(q=>q.id===target?{...q,question:q.question+' mutation'}:q);assert.throws(()=>recovery.verify(bad,ledger));assert.throws(()=>require(D+'check-original-inventory.cjs').verify(bad,ledger));}
});
test('CRK recovery rejects rehashed wrong answers, years, source evidence and omitted selections',()=>{
 for(const change of [b=>b.records[0].candidate.answer=b.records[0].candidate.answer==='A'?'B':'A',b=>b.records[0].candidate.year=2099,b=>b.records[0].source_pdf_page=59,b=>b.held_records.pop()]){
  const bad=structuredClone(batch);change(bad);bad.records[0].content_sha256=fp(bad.records[0].candidate);const raw=JSON.stringify(bad),manifest=structuredClone(require(D+'recovery-manifest.json'));
  assert.throws(()=>recovery.load({files:{'crk-recovery003.json':raw}}));
  manifest.batches[2].sha256=crypto.createHash('sha256').update(raw).digest('hex');assert.throws(()=>recovery.load({manifest,files:{'crk-recovery003.json':raw}}),/independent recovery pins/);
 }
});
test('CRK recovery cannot replay a recovered question into another held ID',()=>{
 const target=batch.held_records[0].id,q={...batch.records[0].candidate,id:target};
 const bad=pool.map(r=>r.id===target?q:r),forged=structuredClone(ledger);forged.questions[target]={...forged.questions[batch.records[0].id],content_sha256:fp(q)};
 assert.throws(()=>recovery.verify(bad,forged),/no recovery evidence/);
});
