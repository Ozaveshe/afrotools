'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2015-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={2015:{43:'A',44:'B',45:'C',47:'C',48:'C',49:'D',50:'B',51:'A',52:'C',53:'C',54:'A',55:'C',57:'D',58:'B',60:'C',61:'B',62:'B',63:'A'},2017:{44:'A',45:'C',46:'B',47:'D',48:'B',50:'C'}};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2015,2017]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2015?batch.held_records:[];
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:24,held:16,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
