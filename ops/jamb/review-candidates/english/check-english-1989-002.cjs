'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1989-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1989-33-086e7ad1572c":"B","english-1989-34-7b51db41d64d":"A","english-1989-35-805305efc3c0":"B","english-1989-36-e88bb81c2f38":"A","english-1989-38-28a64b77d45d":"A","english-1989-39-0ed2e62e2095":"C","english-1989-40-6c5b2289919e":"C","english-1989-41-5cd41044ca38":"A","english-1989-42-71108b238d71":"C","english-1989-44-446fe7522699":"D","english-1989-45-eefbb8bf717d":"B","english-1989-46-a2a5b2be3c37":"C","english-1989-47-61ecac49b319":"A","english-1989-48-6031de77a758":"C","english-1989-49-d233b87f1616":"D","english-1989-50-4606afe5574a":"B","english-1989-51-a4e993fc27a2":"B","english-1989-52-c08f2b9bc5e5":"D"};
const canonicalNumbers={"english-1989-33-086e7ad1572c":33,"english-1989-34-7b51db41d64d":34,"english-1989-35-805305efc3c0":35,"english-1989-36-e88bb81c2f38":36,"english-1989-38-28a64b77d45d":38,"english-1989-39-0ed2e62e2095":39,"english-1989-40-6c5b2289919e":40,"english-1989-41-5cd41044ca38":41,"english-1989-42-71108b238d71":42,"english-1989-44-446fe7522699":44,"english-1989-45-eefbb8bf717d":45,"english-1989-46-a2a5b2be3c37":46,"english-1989-47-61ecac49b319":47,"english-1989-48-6031de77a758":48,"english-1989-49-d233b87f1616":49,"english-1989-50-4606afe5574a":50,"english-1989-51-a4e993fc27a2":51,"english-1989-52-c08f2b9bc5e5":52};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:18,held:2,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
