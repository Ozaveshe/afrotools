'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2011-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2010":{"11":"B","12":"C","13":"D","26":"B","27":"B","28":"B","30":"C","31":"C","32":"B","33":"A","35":"A","36":"D","38":"C","39":"B","41":"D","42":"D","43":"C","44":"A","45":"D","46":"A","47":"A","48":"A"},"2011":{"95":"C","97":"C","98":"C","99":"B"}};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2010,2011]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2010?batch.held_records:[];
  check({...batch,records,held_records,examined_count:records.length+held_records.length},keys[year],held_records.length,year===2010?3:0);
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:26,held:14,passages:3,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
