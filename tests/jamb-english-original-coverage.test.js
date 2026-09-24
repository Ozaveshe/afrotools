'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {inspect,load,verify,reconstructOriginals,publisherCollectionRecords}=require('../ops/jamb/review-candidates/english/check-original-coverage.cjs');
test('all original English imports have exactly one pinned candidate or private hold',()=>{const r=verify();assert.equal(r.original_records,4163);assert.equal(r.remaining,0);assert.equal(r.candidates,2162);assert.equal(r.held,2001);});
test('coverage rejects omissions, duplicate dispositions and unknown IDs',()=>{
 const {originals,batches}=load();
 const omitted=structuredClone(batches);omitted[0].batch.records.pop();omitted[0].batch.examined_count--;assert.throws(()=>inspect(originals,omitted),/unexamined original IDs/);
 const duplicate=structuredClone(batches);duplicate[0].batch.records.push(duplicate[0].batch.records[0]);duplicate[0].batch.examined_count++;assert.throws(()=>inspect(originals,duplicate),/duplicate disposition/);
 const unknown=structuredClone(batches);unknown[0].batch.records[0].id='english-unknown';assert.throws(()=>inspect(originals,unknown),/unknown original ID/);
});
test('coverage rejects altered originals and missing private hold reasons',()=>{
 const {originals,batches}=load();
 const mutated=structuredClone(batches);mutated[0].batch.records[0].original_content_sha256='0'.repeat(64);assert.throws(()=>inspect(originals,mutated),/original fingerprint/);
 const unreasoned=structuredClone(batches);unreasoned[0].batch.held_records[0].reason='';assert.throws(()=>inspect(originals,unreasoned),/missing private hold reason/);
});
function integrationFixture(){
 const {originals,batches}=load(),{batch}=batches[0],r=batch.records[0];
 const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:r.candidate.verification.reviewed_at,evidence:'Synthetic accepted integration fixture'};
 const ledger={sources:{[batch.source_id]:batch.source},questions:{[r.id]:{source_id:batch.source_id,content_sha256:r.content_sha256,question_review:review,answer_review:review,explanation_review:review}}};
 return {originals,batches,r,ledger,current:originals.map(q=>q.id===r.id?r.candidate:q)};
}
test('coverage reconstructs originals only after exact candidate and accepted ledger checks',()=>{
 const {originals,batches,current,ledger}=integrationFixture();
 assert.deepEqual(inspect(reconstructOriginals(current,batches,ledger),batches),inspect(originals,batches));
 assert.throws(()=>reconstructOriginals(current,batches),/accepted source identity/);
});
test('coverage rejects altered current rows even with self-consistently forged accepted hashes',()=>{
 const {questionFingerprint}=require('../scripts/lib/jamb-content-trust');
 const {batches,current,r,ledger}=integrationFixture(),bad={...r.candidate,answer:r.candidate.answer==='A'?'B':'A'};
 ledger.questions[r.id].content_sha256=questionFingerprint(bad);
 assert.throws(()=>reconstructOriginals(current.map(q=>q.id===r.id?bad:q),batches,ledger),/neither original nor exact candidate/);
});
test('coverage rejects incomplete or mismatching accepted review evidence and altered holds',()=>{
 const {batches,current,r,ledger}=integrationFixture();
 const forged=structuredClone(ledger);forged.questions[r.id].answer_review={status:'accepted'};
 assert.throws(()=>reconstructOriginals(current,batches,forged),/accepted matching ledger required/);
 const mismatched=structuredClone(ledger);mismatched.questions[r.id].content_sha256='0'.repeat(64);
 assert.throws(()=>reconstructOriginals(current,batches,mismatched),/review_content_changed/);
 const wrongSource=structuredClone(ledger);wrongSource.sources[wrongSource.questions[r.id].source_id].content_sha256='0'.repeat(64);
 assert.throws(()=>reconstructOriginals(current,batches,wrongSource),/accepted source fingerprint/);
 const h=batches[0].batch.held_records[0];
 assert.throws(()=>reconstructOriginals(current.map(q=>q.id===h.id?{...q,question:q.question+' altered'}:q),batches,ledger),/held current fingerprint/);
});
test('later reviewed intake cannot hide altered records from the original inventory',()=>{
 const ledger=require('../data/jamb/review-ledger.json');
 const records=require('../ops/jamb/verification/english-2019-publishable-900.json').records;
 const {batches}=load();
 for(const r of records){
  assert.deepEqual(reconstructOriginals([r.after],batches,ledger),r.before?[r.before]:[]);
  assert.throws(()=>reconstructOriginals([{...r.after,answer:r.after.answer==='A'?'B':'A'}],batches,ledger));
  const missing=structuredClone(ledger);delete missing.questions[r.id].answer_review;
  assert.throws(()=>reconstructOriginals([r.after],batches,missing));
 }
 const unknown={...records.find(r=>!r.before).after,id:'english-unregistered-new-record'};
 assert.deepEqual(reconstructOriginals([unknown],batches,ledger),[unknown]);
});
test('recent reviewed collection intake is excluded only with exact source and ledger evidence',()=>{
 const {batches}=load();
 const ledger=require('../data/jamb/review-ledger.json');
 const row=require('../ops/jamb/source-pool.json').questions.find(q=>q.id==='english-2023-poscholars-26');
 assert.deepEqual(reconstructOriginals([row],batches,ledger),[]);
 assert.throws(()=>reconstructOriginals([{...row,answer:row.answer==='A'?'B':'A'}],batches,ledger),/recent intake fingerprint/);
 const missing=structuredClone(ledger);delete missing.questions[row.id].answer_review;
 assert.throws(()=>reconstructOriginals([row],batches,missing),/recent intake eligibility required/);
});

test('2024 publisher collection is excluded only with its pinned per-item source and accepted review',()=>{
 const root=path.resolve(__dirname,'..');
 const bytes=fs.readFileSync(path.join(root,'ops/nigeria-exams/jamb-english-2024-curated.json'));
 const manifest=JSON.parse(bytes),hash=crypto.createHash('sha256').update(bytes).digest('hex');
 const pool=require('../ops/jamb/source-pool.json'),ledger=require('../data/jamb/review-ledger.json');
 const {prepareBatch}=require('../ops/nigeria-exams/import-jamb-english-2024.cjs');
 const prepared=prepareBatch(manifest,hash,pool,ledger);
 const releases=publisherCollectionRecords([prepared.batch]);
 const {originals,batches}=load();
 const row=prepared.pool.questions.find(q=>q.id==='english-2024-myschool-69885');
 assert.deepEqual(reconstructOriginals([row],batches,prepared.ledger,releases),[]);
 assert.throws(()=>reconstructOriginals([{...row,answer:'A'}],batches,prepared.ledger,releases),/recent intake fingerprint/);
 const missing=structuredClone(prepared.ledger);delete missing.questions[row.id].answer_review;
 assert.throws(()=>reconstructOriginals([row],batches,missing,releases),/recent intake eligibility required/);
 const wrongSource=structuredClone(prepared.ledger);wrongSource.sources[wrongSource.questions[row.id].source_id].source_url='https://myschool.ng/wrong-source';
 assert.throws(()=>reconstructOriginals([row],batches,wrongSource,releases),/recent intake source URL/);
 assert.equal(publisherCollectionRecords([{...prepared.batch,year_basis:'authenticated-sitting'}]).size,0);
 assert.deepEqual(reconstructOriginals([row],batches,prepared.ledger,new Map()),[row]);
 assert.throws(()=>inspect([...originals,row],batches),/unexamined original IDs/);
});
