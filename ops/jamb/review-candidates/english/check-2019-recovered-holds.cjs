'use strict';
const assert=require('node:assert/strict');
const {questionFingerprint,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const replacements=require('../../verification/english-2019-publishable-900.json');
const ids=new Set(['english-2018-27-323addc9d882','english-2018-30-5fbb48f60f49','english-2018-79-1e51176fe277','english-2018-94-2fd153fafda7']);
// Keep historical hold evidence immutable. Only these exact reviewed replacements
// may supersede it during integrated replay; pre-intake replay remains unchanged.
function verifyRecoveredHold(held,current,integrated,ledger=require('../../../../data/jamb/review-ledger.json')){
 if(!integrated||!ids.has(held.id))return false;
 const r=replacements.records.find(r=>r.id===held.id);assert.ok(r);
 assert.equal(questionFingerprint(r.before),held.original_content_sha256);
 assert.deepEqual(current,r.after);assert.equal(questionFingerprint(current),r.content_sha256);
 assert.equal(current.year,2019);
 const review=ledger.questions[held.id];assert.ok(review);
 assert.equal(review.content_sha256,r.content_sha256);
 assert.ok(review.answer_review?.evidence.includes('english-2019-publishable-900.json#'+held.id));
 assert.ok(review.answer_review.evidence.includes('check-english-2019-900.cjs'));
 assert.equal(assessQuestion(current,ledger).state,'eligible');
 return true;
}
module.exports={verifyRecoveredHold};
