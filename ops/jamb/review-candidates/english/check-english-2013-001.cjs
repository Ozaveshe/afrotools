'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2013-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"36":"B","37":"C","38":"B","40":"B","41":"A","43":"A","44":"A","46":"B","47":"C","48":"A","49":"A","50":"D","51":"A","52":"B","53":"A","54":"D","55":"D","56":"B","58":"D","59":"A","60":"A","61":"B","62":"A","63":"C","64":"D","65":"A","66":"A","67":"A","68":"C","69":"B","70":"C"};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 check(batch,keys,9,0);
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:31,held:9,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
