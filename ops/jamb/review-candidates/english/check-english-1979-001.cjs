'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1979-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1979-69-d8e5e5ab1e7a":"D","english-1979-70-fa6e5147eba0":"E","english-1979-71-14986c1c9451":"C","english-1979-72-7ab812c387d1":"A","english-1979-75-23ad6cf5ecde":"B","english-1979-78-ecc12e124f1c":"D","english-1979-83-ee275a83cce5":"C","english-1979-85-aa5992b5b00a":"B","english-1979-86-52e1d3f329bb":"E","english-1979-87-02181c44d3b7":"C"};
const canonicalNumbers={"english-1979-69-d8e5e5ab1e7a":69,"english-1979-70-fa6e5147eba0":70,"english-1979-71-14986c1c9451":71,"english-1979-72-7ab812c387d1":72,"english-1979-75-23ad6cf5ecde":75,"english-1979-78-ecc12e124f1c":78,"english-1979-83-ee275a83cce5":83,"english-1979-85-aa5992b5b00a":85,"english-1979-86-52e1d3f329bb":86,"english-1979-87-02181c44d3b7":87};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
