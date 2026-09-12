'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1995-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1995-62-753d1d7fd1c6":"C","english-1995-63-4994bba01717":"D","english-1995-64-2c2ec39ea51a":"A","english-1995-65-f589efcd60e6":"B","english-1995-66-ffd3048868e3":"B","english-1995-67-6f4deda9b90f":"C","english-1995-79-5cf1bde92590":"B","english-1995-81-1f4f6f39b6d3":"C"};
const canonicalNumbers={"english-1995-62-753d1d7fd1c6":62,"english-1995-63-4994bba01717":63,"english-1995-64-2c2ec39ea51a":64,"english-1995-65-f589efcd60e6":65,"english-1995-66-ffd3048868e3":66,"english-1995-67-6f4deda9b90f":67,"english-1995-79-5cf1bde92590":79,"english-1995-81-1f4f6f39b6d3":81};
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
