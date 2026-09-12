'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1979-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1978-16-c9c6093d6d0d":"C","english-1978-26-bd5cc22bbfd9":"C","english-1978-27-4b4165ae21a6":"B","english-1978-28-73baac42b829":"E","english-1978-29-c0c46589168f":"C","english-1978-30-e4083dea93bc":"C","english-1978-31-dcf27b37fde9":"A","english-1978-32-fd8ac892eddf":"D","english-1978-33-10d7bfb375a2":"B","english-1978-34-0f3330b43d54":"A","english-1978-35-26753ae41de9":"C","english-1978-37-36ce687cb6ff":"A","english-1978-39-e3eaf136b099":"A"};
const canonicalNumbers={"english-1978-16-c9c6093d6d0d":16,"english-1978-26-bd5cc22bbfd9":26,"english-1978-27-4b4165ae21a6":27,"english-1978-28-73baac42b829":28,"english-1978-29-c0c46589168f":29,"english-1978-30-e4083dea93bc":30,"english-1978-31-dcf27b37fde9":31,"english-1978-32-fd8ac892eddf":32,"english-1978-33-10d7bfb375a2":33,"english-1978-34-0f3330b43d54":34,"english-1978-35-26753ae41de9":35,"english-1978-37-36ce687cb6ff":37,"english-1978-39-e3eaf136b099":39};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:1,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
