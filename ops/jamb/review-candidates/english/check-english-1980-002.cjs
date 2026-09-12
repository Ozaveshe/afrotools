'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1980-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1980-59-08c8348da5ca":"A","english-1980-60-e66dc8a39a57":"C","english-1980-63-96305f8d0b90":"E","english-1980-64-7c28cf9c0e59":"C","english-1980-65-dc2ad86d26ba":"C","english-1980-67-dd6b4d8622ca":"A","english-1980-69-90e99494cf1b":"C","english-1980-70-edb7d4c622e2":"D","english-1980-71-ee5e95e2f60c":"B","english-1980-72-4833666e3b88":"A","english-1980-74-7964c335cdba":"C","english-1980-75-ea0291f65288":"A","english-1980-76-1d7655cd1efc":"E","english-1980-77-16ad68a0fc79":"D","english-1980-78-751c71b8abcf":"D"};
const canonicalNumbers={"english-1980-59-08c8348da5ca":59,"english-1980-60-e66dc8a39a57":60,"english-1980-63-96305f8d0b90":63,"english-1980-64-7c28cf9c0e59":64,"english-1980-65-dc2ad86d26ba":65,"english-1980-67-dd6b4d8622ca":67,"english-1980-69-90e99494cf1b":69,"english-1980-70-edb7d4c622e2":70,"english-1980-71-ee5e95e2f60c":71,"english-1980-72-4833666e3b88":72,"english-1980-74-7964c335cdba":74,"english-1980-75-ea0291f65288":75,"english-1980-76-1d7655cd1efc":76,"english-1980-77-16ad68a0fc79":77,"english-1980-78-751c71b8abcf":78};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:15,held:5,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
