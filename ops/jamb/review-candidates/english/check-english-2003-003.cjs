'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2003-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2003-46-a6edfd12576c":"A","english-2003-47-18d03d9f4c1b":"C","english-2003-48-434ea8a19e8f":"B","english-2003-49-dc62aac99bfc":"C","english-2003-52-ce7ebc685316":"B","english-2003-53-1ae6ec91a1f7":"A","english-2003-54-ac9c0bfbdb54":"A","english-2003-55-9b96f3e59403":"B","english-2003-56-2ee9d9b859f8":"C","english-2003-57-a147026d3f78":"D","english-2003-58-9ebc88cd616f":"C","english-2003-59-3c7c822c87ae":"A","english-2003-60-51ef4b72dd4a":"C","english-2003-96-61a8162dd0c9":"D","english-2003-97-ae792daa2328":"D","english-2003-99-d9d250b5c6fc":"C"};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
