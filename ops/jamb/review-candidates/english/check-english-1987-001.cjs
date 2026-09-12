'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1987-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1987-1-bb8769aec573":"B","english-1987-2-4d72eb32ec2d":"D","english-1987-3-14666551d205":"A","english-1987-6-62572ea0f4ac":"C","english-1987-7-f12afd282467":"C","english-1987-8-58ac78c11550":"D","english-1987-9-cf3596e6d8fe":"C","english-1987-11-d0670eb8aa26":"A","english-1987-13-b0ccc5db0e94":"C","english-1987-16-cb42696afa7d":"C","english-1987-17-29ac6d38231e":"A","english-1987-21-ef599a077830":"C","english-1987-22-1d777c5c444c":"A","english-1987-23-d7562be7f3f8":"B","english-1987-24-47e20ba0e720":"B"};
const canonicalNumbers={"english-1987-1-bb8769aec573":1,"english-1987-2-4d72eb32ec2d":2,"english-1987-3-14666551d205":3,"english-1987-6-62572ea0f4ac":6,"english-1987-7-f12afd282467":7,"english-1987-8-58ac78c11550":8,"english-1987-9-cf3596e6d8fe":9,"english-1987-11-d0670eb8aa26":11,"english-1987-13-b0ccc5db0e94":13,"english-1987-16-cb42696afa7d":16,"english-1987-17-29ac6d38231e":17,"english-1987-21-ef599a077830":21,"english-1987-22-1d777c5c444c":22,"english-1987-23-d7562be7f3f8":23,"english-1987-24-47e20ba0e720":24};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ assert.equal(r.candidate.num,canonicalNumbers[r.id]); check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,r.candidate.passage?1:0); }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,20);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:15,held:5,passages:15,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
