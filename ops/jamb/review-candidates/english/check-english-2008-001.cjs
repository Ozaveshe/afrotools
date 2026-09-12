'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2008-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2008":{"27":"C","28":"B","31":"B","32":"C","33":"D","35":"A","36":"B","37":"B","38":"C","42":"A","43":"A","44":"D","45":"C","47":"D","49":"C","50":"A","51":"C","53":"B","54":"D","55":"C","56":"C","57":"C","59":"B","60":"B","61":"B","62":"A","63":"A","64":"A","65":"C","70":"C"}};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2008]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2008?batch.held_records:[];
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
