'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2004-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{"78":"C","80":"C","81":"D","82":"C"},"2005":{"78":"B","79":"B","80":"D","82":"C"},"2006":{"78":"A","81":"C","82":"C"}};
const keysById={"english-2004-78-5cd18278fd30":"C","english-2004-78-89bd756895fd":"B","english-2004-78-00db28d5c759":"A","english-2004-79-77c56cee1b81":"B","english-2004-80-18c402bb9dab":"C","english-2004-80-a1a390bd85bd":"D","english-2004-81-c58f52f347c3":"D","english-2004-81-2f51100d5118":"C","english-2004-82-c3ec8d8068e9":"C","english-2004-82-144e6d3a303b":"C","english-2004-82-ab1bf4c97cc3":"C"};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,0); }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,20);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:11,held:9,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
