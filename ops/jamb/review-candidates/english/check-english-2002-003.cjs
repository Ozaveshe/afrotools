'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2002-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2002-61-50f8df9d1b71":"A","english-2002-62-0659e6a72f2e":"B","english-2002-63-0e3c85b50a21":"C","english-2002-64-f03b9fae196c":"C","english-2002-65-8ad4f650e48b":"B","english-2002-66-953c970f40d6":"B","english-2002-67-8d015f32a005":"C","english-2002-68-0ae1a73f07b1":"B","english-2002-69-babe1b7fb317":"C","english-2002-70-4d02a187c8c1":"A","english-2002-71-f0bcbb39b996":"D","english-2002-72-93b19a431ff9":"C","english-2002-73-fad05ab3c941":"A"};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,r.candidate.passage?1:0); }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,20);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
