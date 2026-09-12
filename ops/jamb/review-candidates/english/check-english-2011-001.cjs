'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2011-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"46":"A","47":"C","48":"C","49":"B","50":"D","51":"C","52":"C","53":"D","54":"C","55":"D","56":"A","57":"A","58":"B","59":"B","61":"C","62":"C","63":"B","64":"B","65":"C","67":"D","70":"D","71":"D","72":"B","74":"B","75":"B","76":"C","78":"D","80":"C","81":"B","82":"C","83":"B"};
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
