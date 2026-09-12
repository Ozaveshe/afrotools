'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2012-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"37":"B","38":"D","39":"A","40":"C","41":"D","42":"A","43":"A","45":"A","48":"C","49":"A","50":"A","51":"B","52":"B","53":"A","54":"B","55":"B","56":"D","57":"A","58":"C","60":"D","61":"B","62":"A","63":"C","64":"A","65":"B","66":"C","68":"D","69":"B","72":"D","74":"B","75":"C","76":"B","77":"B","78":"D"};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 check(batch,keys,6,0);
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:34,held:6,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
