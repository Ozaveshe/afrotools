'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2018-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={
 2018:{1:'E',2:'B',3:'D',7:'D',8:'C',9:'C',11:'A',12:'D',13:'C',14:'A',26:'A',29:'D',46:'D',47:'C',48:'B',49:'A',52:'D',53:'B',54:'A'},
 2019:{36:'D',38:'D',40:'B',46:'D',47:'D',48:'B',52:'B',53:'A'}
};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q]));
 const ids=new Set();
 for(const year of [2018,2019]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2018?batch.held_records:[];
  check({...batch,records,held_records,examined_count:records.length+held_records.length},keys[year],held_records.length,year===2018?10:0);
 }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id),'Duplicate candidate ID');ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);
 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id),'Duplicate held ID');ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:27,held:13,passages:10,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
