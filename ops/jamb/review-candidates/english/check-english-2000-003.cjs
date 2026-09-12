'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2000-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2000-68-6d42da101815":"A","english-2000-69-dd872eb44046":"C","english-2000-70-b06d4b432e6d":"B","english-2000-71-7412b91af3da":"D","english-2000-72-ba4a33563334":"A","english-2000-73-34ae3e695b8d":"B","english-2000-75-8fa6a40e3c94":"D","english-2000-76-079a2413d470":"D","english-2000-78-ada6c369b071":"A","english-2000-79-af130a227ed1":"B","english-2000-80-3b664f0d95ee":"D","english-2000-81-731afb147cf2":"C","english-2000-82-5ff4f1fab137":"D","english-2000-83-223055f22fb6":"B","english-2000-84-8ad56549d451":"A","english-2000-85-e1bdb6099804":"C","english-2000-86-cb3e5b4f146e":"B","english-2000-87-1f1c277bd073":"D"};
const canonicalNumbers={"english-2000-68-6d42da101815":82,"english-2000-69-dd872eb44046":83,"english-2000-70-b06d4b432e6d":95,"english-2000-71-7412b91af3da":94,"english-2000-72-ba4a33563334":87,"english-2000-73-34ae3e695b8d":80,"english-2000-75-8fa6a40e3c94":84,"english-2000-76-079a2413d470":88,"english-2000-78-ada6c369b071":91,"english-2000-79-af130a227ed1":89,"english-2000-80-3b664f0d95ee":86,"english-2000-81-731afb147cf2":81,"english-2000-82-5ff4f1fab137":85,"english-2000-83-223055f22fb6":93,"english-2000-84-8ad56549d451":92,"english-2000-85-e1bdb6099804":67,"english-2000-86-cb3e5b4f146e":69,"english-2000-87-1f1c277bd073":77};
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
