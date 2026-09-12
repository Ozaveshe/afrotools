'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-012.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-86-1d84c1e12f77":"A","english-1992-87-a8d0a5c7522c":"B","english-1992-89-8082f3b3675d":"C","english-1992-89-e0194df98639":"B","english-1992-90-5a918ae4a217":"B","english-1992-90-fb0e0aea41aa":"A","english-1992-91-f9cc5ed6e285":"C","english-1992-91-a99e766a78f0":"D","english-1992-92-ce52ae29bb12":"A","english-1992-92-951a763ce0bc":"D","english-1992-93-36af44d61ae1":"D","english-1992-93-0024f4cde5b0":"A"};
const canonicalNumbers={"english-1992-86-1d84c1e12f77":86,"english-1992-87-a8d0a5c7522c":87,"english-1992-89-8082f3b3675d":89,"english-1992-89-e0194df98639":89,"english-1992-90-5a918ae4a217":90,"english-1992-90-fb0e0aea41aa":90,"english-1992-91-f9cc5ed6e285":91,"english-1992-91-a99e766a78f0":91,"english-1992-92-ce52ae29bb12":92,"english-1992-92-951a763ce0bc":92,"english-1992-93-36af44d61ae1":93,"english-1992-93-0024f4cde5b0":93};
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
