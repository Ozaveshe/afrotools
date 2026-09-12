'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1988-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1988-36-d9613846628d":"C","english-1988-37-ccb24145032d":"B","english-1988-38-9e3f531c5bcc":"C","english-1988-39-803a4bd1910c":"C","english-1988-40-3b4e0db44166":"A","english-1988-41-c044db80c9f4":"A","english-1988-42-9781b635c725":"D"};
const canonicalNumbers={"english-1988-36-d9613846628d":36,"english-1988-37-ccb24145032d":37,"english-1988-38-9e3f531c5bcc":38,"english-1988-39-803a4bd1910c":39,"english-1988-40-3b4e0db44166":40,"english-1988-41-c044db80c9f4":41,"english-1988-42-9781b635c725":42};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:7,held:13,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
