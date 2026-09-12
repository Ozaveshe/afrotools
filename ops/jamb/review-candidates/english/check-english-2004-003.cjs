'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2004-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{"41":"A","42":"B","43":"A","44":"D","45":"A","46":"C","47":"B","55":"C"},"2005":{"40":"C","42":"A","45":"B","46":"A","47":"D","49":"C","50":"D","51":"B","52":"B","53":"D","55":"B","56":"C"},"2006":{"40":"C","47":"A","48":"C","49":"C","50":"D","51":"A","52":"C","53":"C","55":"B","56":"A"}};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2004,2005,2006]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2004?batch.held_records:[];
  check({...batch,records,held_records,examined_count:records.length+held_records.length},keys[year],held_records.length,0);
 }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:30,held:10,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
