'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2004-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{"27":"A","28":"B","29":"D","31":"D","34":"A","36":"D","37":"A","38":"C","39":"A","40":"B"},"2005":{"27":"D","28":"A","29":"A","30":"A","32":"B","33":"B","36":"D","37":"B","39":"C"},"2006":{"26":"A","27":"D","28":"A","29":"C","31":"D","32":"A","33":"D","34":"A","35":"B","36":"D","37":"A","38":"C","39":"A"}};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:32,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
