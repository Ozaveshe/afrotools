'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2013-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2012":{"2":"A","3":"C","4":"D","11":"B","12":"D","13":"B","27":"A","28":"D","29":"C","32":"C","34":"B","36":"D"},"2013":{"71":"B","72":"B","73":"B","74":"B","75":"C","77":"D","78":"A","81":"D","82":"D","83":"C","84":"A","96":"C","98":"C","99":"D"}};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2012,2013]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2012?batch.held_records:[];
  check({...batch,records,held_records,examined_count:records.length+held_records.length},keys[year],held_records.length,year===2012?6:0);
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:26,held:14,passages:6,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
