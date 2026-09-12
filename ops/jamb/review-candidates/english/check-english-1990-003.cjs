'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1990-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-46-8f69fb356e65":"C","english-1990-47-9c2462729c23":"A","english-1990-48-6d3c9e2c3ed4":"B","english-1990-49-aca5a750d6d0":"D","english-1990-51-b3030206a71b":"C","english-1990-53-75cc6534ff9d":"A","english-1990-54-b709f7e3eef8":"C","english-1990-55-be6ddacc2985":"D"};
const canonicalNumbers={"english-1990-46-8f69fb356e65":46,"english-1990-47-9c2462729c23":47,"english-1990-48-6d3c9e2c3ed4":48,"english-1990-49-aca5a750d6d0":49,"english-1990-51-b3030206a71b":51,"english-1990-53-75cc6534ff9d":53,"english-1990-54-b709f7e3eef8":54,"english-1990-55-be6ddacc2985":55};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:8,held:12,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
