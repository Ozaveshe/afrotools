'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1986-011.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1986-97-dc742f0c5ee2":"B","english-1986-100-b2194d8ffbfe":"C","english-1985-1-80bd6572a252":"A","english-1985-4-d11bb577e8bd":"D","english-1985-6-365a46cac6a1":"E","english-1985-7-af23b3190468":"C"};
const canonicalNumbers={"english-1986-97-dc742f0c5ee2":97,"english-1986-100-b2194d8ffbfe":100,"english-1985-1-80bd6572a252":1,"english-1985-4-d11bb577e8bd":4,"english-1985-6-365a46cac6a1":6,"english-1985-7-af23b3190468":7};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:6,held:14,passages:4,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
