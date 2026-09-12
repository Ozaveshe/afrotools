'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1987-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1987-87-ea1345e8264d":"A","english-1987-88-951a013e2795":"A","english-1987-90-74975b7718c7":"D","english-1987-91-b7eb0284e43f":"A","english-1987-94-ab0e1d73448b":"A","english-1987-95-a0fa78070ceb":"D","english-1987-96-58f79e01e4e2":"B","english-1987-97-5f65086c2893":"B","english-1987-98-b3a4d6088dc4":"C","english-1986-2-37593b6eac85":"C","english-1986-4-ba4126ff4374":"C","english-1986-4-0a84f362381c":"D","english-1986-5-cbf9767832ea":"C"};
const canonicalNumbers={"english-1987-87-ea1345e8264d":87,"english-1987-88-951a013e2795":88,"english-1987-90-74975b7718c7":90,"english-1987-91-b7eb0284e43f":91,"english-1987-94-ab0e1d73448b":94,"english-1987-95-a0fa78070ceb":95,"english-1987-96-58f79e01e4e2":96,"english-1987-97-5f65086c2893":97,"english-1987-98-b3a4d6088dc4":98,"english-1986-2-37593b6eac85":2,"english-1986-4-ba4126ff4374":4,"english-1986-4-0a84f362381c":4,"english-1986-5-cbf9767832ea":85};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:3,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
