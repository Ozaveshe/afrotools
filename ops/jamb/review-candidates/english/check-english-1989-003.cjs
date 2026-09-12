'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1989-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1989-53-7eeb975d79bb":"D","english-1989-55-0b6bfa4333fa":"C","english-1989-56-b69fc01ebff9":"B","english-1989-57-f7e88659b8d9":"C","english-1989-58-a00b273c5463":"C","english-1989-59-ac81dadf8819":"B","english-1989-60-7a5d9eb616e6":"B","english-1989-61-999b89e93961":"B","english-1989-63-36ea18e97a16":"B","english-1989-65-35047c5501aa":"C","english-1989-66-9a35ab4b0f3a":"A","english-1989-68-89fc01666450":"B","english-1989-69-62496a79685e":"C","english-1989-72-d4a819cacdea":"C","english-1989-73-08d82a048bd9":"A","english-1989-74-9bc873f9f01f":"A"};
const canonicalNumbers={"english-1989-53-7eeb975d79bb":53,"english-1989-55-0b6bfa4333fa":55,"english-1989-56-b69fc01ebff9":56,"english-1989-57-f7e88659b8d9":57,"english-1989-58-a00b273c5463":58,"english-1989-59-ac81dadf8819":59,"english-1989-60-7a5d9eb616e6":60,"english-1989-61-999b89e93961":61,"english-1989-63-36ea18e97a16":63,"english-1989-65-35047c5501aa":65,"english-1989-66-9a35ab4b0f3a":66,"english-1989-68-89fc01666450":68,"english-1989-69-62496a79685e":69,"english-1989-72-d4a819cacdea":72,"english-1989-73-08d82a048bd9":73,"english-1989-74-9bc873f9f01f":74};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
