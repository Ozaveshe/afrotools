'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1989-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1989-75-16152ad5049d":"A","english-1989-76-7d6598592254":"C","english-1989-78-955ad4c11fb2":"D","english-1989-80-53f567897722":"B","english-1989-83-5e168194d3f3":"B","english-1989-84-6f16fb122e85":"C","english-1989-87-0b47ea8b8d61":"B","english-1989-88-f600d7e52c39":"D","english-1989-89-1aaf927986b6":"B","english-1989-92-eca27902a07c":"D","english-1989-93-528ad8817893":"B","english-1989-94-9d20cd5e314d":"B"};
const canonicalNumbers={"english-1989-75-16152ad5049d":75,"english-1989-76-7d6598592254":76,"english-1989-78-955ad4c11fb2":78,"english-1989-80-53f567897722":80,"english-1989-83-5e168194d3f3":83,"english-1989-84-6f16fb122e85":84,"english-1989-87-0b47ea8b8d61":87,"english-1989-88-f600d7e52c39":88,"english-1989-89-1aaf927986b6":89,"english-1989-92-eca27902a07c":92,"english-1989-93-528ad8817893":93,"english-1989-94-9d20cd5e314d":94};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
