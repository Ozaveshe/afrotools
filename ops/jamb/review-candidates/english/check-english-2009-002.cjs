'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2009-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2009":{"58":"A","59":"C","61":"D","62":"C","63":"C","64":"B","66":"C","69":"B","71":"B","72":"D","74":"A","75":"D","76":"D","77":"D","78":"B","82":"B","83":"A","84":"B","95":"C","96":"D","98":"B","99":"D"}};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2009]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2009?batch.held_records:[];
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:22,held:18,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
