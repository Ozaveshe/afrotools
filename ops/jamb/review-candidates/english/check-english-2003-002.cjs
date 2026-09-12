'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2003-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2003-14-72fb227de4f2":"C","english-2003-26-0a03bbbef2bb":"A","english-2003-27-5bec04449e21":"B","english-2003-28-d7ce693ef3d0":"C","english-2003-29-9503f91d8552":"D","english-2003-31-4d5bc9ce75a7":"D","english-2003-32-2ad8eb0088b5":"C","english-2003-33-64b096f1b2b7":"B","english-2003-34-cd29d6b738aa":"A","english-2003-35-8b7fad24cd21":"C","english-2003-36-5da0aba610b9":"B","english-2003-37-6d4592222e6b":"B","english-2003-39-fb040ab0cac6":"A","english-2003-40-fa94bc66d036":"B","english-2003-41-605a113594fb":"C","english-2003-42-e7e381792e37":"A","english-2003-43-e2773095243e":"C","english-2003-45-1c6bd49a0095":"D"};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:18,held:2,passages:1,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
