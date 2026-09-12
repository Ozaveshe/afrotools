'use strict';
const assert=require('node:assert/strict'),poolRecordHash=require('./pool-record-hash.cjs');
const candidate={id:'prior',publication_candidate:true,original_content_sha256:'original',content_sha256:'candidate'};
const accepted={questions:{prior:{content_sha256:'candidate',question_review:{status:'accepted'},answer_review:{status:'accepted'},explanation_review:{status:'accepted'}}}};
const base={integrated:false,mixedPrior:true,currentIds:new Set(['current']),ledger:accepted};
assert.equal(poolRecordHash(candidate,base),'candidate');
assert.equal(poolRecordHash(candidate,{...base,mixedPrior:false}),'original');
assert.equal(poolRecordHash(candidate,{...base,ledger:{questions:{}}}),'original');
assert.equal(poolRecordHash(candidate,{...base,integrated:true,ledger:{questions:{}}}),'candidate');
assert.equal(poolRecordHash({...candidate,id:'current'},base),'original');
assert.equal(poolRecordHash({...candidate,id:'current'},{...base,integrated:true}),'candidate');
assert.throws(()=>poolRecordHash({...candidate,publication_candidate:false},base),/Held prior record/);
const wrongHash=structuredClone(accepted);wrongHash.questions.prior.content_sha256='changed';
assert.throws(()=>poolRecordHash(candidate,{...base,ledger:wrongHash}),/fingerprint drift/);
for(const field of ['question_review','answer_review','explanation_review']){
 const incomplete=structuredClone(accepted);incomplete.questions.prior[field].status='pending';
 assert.throws(()=>poolRecordHash(candidate,{...base,ledger:incomplete}),/review is incomplete/);
}
console.log('Government mixed-prior ledger, fingerprint, held and current-batch guards passed');
