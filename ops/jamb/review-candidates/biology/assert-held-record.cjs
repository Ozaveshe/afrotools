const assert=require('node:assert/strict'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const id='biology-1985-26-04e4ba28ff31',original='4a2f50b8ee16a8f7fb01a30f3b3b5fab7168cd420b5b2ef432b970499ee26122',candidate='6a9a3c7eb326a0b830b43f1f75394d0888c074651cf66f41d891225ff9f288b7',prior='29b043b33849b2f650dbcb697108fc9fc110a965722a93a757f74739a863043d';
module.exports=function assertHeldRecord(current,historical){
 assert(current);assert.equal(historical.status,'held');assert.equal(questionFingerprint(historical.original_record),historical.original_content_sha256);
 if(process.argv.includes('--integrated')&&historical.id===id&&questionFingerprint(current)===candidate){const r=require('./biology-recovery-001.json').records[0];assert.equal(r.id,id);assert.equal(r.original_content_sha256,original);assert.equal(questionFingerprint(r.candidate),candidate);assert.equal(r.content_sha256,candidate);assert.equal(r.recovery_of.prior_record_sha256,prior);assert.equal(crypto.createHash('sha256').update(JSON.stringify(historical)).digest('hex'),prior);assert.equal(r.recovery_of.prior_hold_reason,historical.hold_reason);return;}
 assert.deepEqual(current,historical.original_record,'Held unexpectedly changed without exact reviewed recovery');
};
