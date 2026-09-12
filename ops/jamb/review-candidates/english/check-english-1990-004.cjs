'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1990-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-59-6176b81a4d04":"C","english-1990-60-7b9f404ab4de":"B","english-1990-61-349a580932b1":"D","english-1990-62-7f2f989012af":"A","english-1990-66-86cd6e5e104a":"C","english-1990-67-ad2974554b4c":"B"};
const canonicalNumbers={"english-1990-59-6176b81a4d04":59,"english-1990-60-7b9f404ab4de":60,"english-1990-61-349a580932b1":61,"english-1990-62-7f2f989012af":62,"english-1990-66-86cd6e5e104a":66,"english-1990-67-ad2974554b4c":67};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:6,held:14,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
