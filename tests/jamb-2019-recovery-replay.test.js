'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {verifyRecoveredHold}=require('../ops/jamb/review-candidates/english/check-2019-recovered-holds.cjs');
const ledger=require('../data/jamb/review-ledger.json');
const replacements=require('../ops/jamb/verification/english-2019-publishable-900.json').records.filter(r=>r.before);
const held=[...require('../ops/jamb/review-candidates/english/english-2018-002.json').held_records,...require('../ops/jamb/review-candidates/english/english-2018-003.json').held_records];
test('only the four exact 2019 recoveries supersede historical holds',()=>{
 assert.equal(replacements.length,4);
 for(const r of replacements){
  const h=held.find(h=>h.id===r.id);assert.ok(h);
  assert.equal(verifyRecoveredHold(h,r.after,true,ledger),true);
  assert.equal(verifyRecoveredHold(h,r.before,false,ledger),false);
  assert.throws(()=>verifyRecoveredHold(h,{...r.after,answer:r.after.answer==='A'?'B':'A'},true,ledger));
  assert.throws(()=>verifyRecoveredHold(h,{...r.after,year:2018},true,ledger));
  assert.throws(()=>verifyRecoveredHold({...h,original_content_sha256:'0'.repeat(64)},r.after,true,ledger));
  const missing=structuredClone(ledger);delete missing.questions[r.id].answer_review;
  assert.throws(()=>verifyRecoveredHold(h,r.after,true,missing));
 }
 assert.equal(verifyRecoveredHold({id:'unrelated-held-record'},null,true,ledger),false);
});
