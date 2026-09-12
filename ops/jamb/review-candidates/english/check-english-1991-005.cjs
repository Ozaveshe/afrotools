'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1991-57-e13165f26bb0":"D","english-1991-60-a0acc58c94f6":"A","english-1991-61-e2621339e0f8":"C","english-1991-63-c675e08471bf":"C","english-1991-65-6117144a6ddc":"C","english-1991-66-9e6fd923f68a":"C","english-1991-67-5b27a97fb68d":"C"};
const canonicalNumbers={"english-1991-57-e13165f26bb0":57,"english-1991-60-a0acc58c94f6":60,"english-1991-61-e2621339e0f8":61,"english-1991-63-c675e08471bf":63,"english-1991-65-6117144a6ddc":65,"english-1991-66-9e6fd923f68a":66,"english-1991-67-5b27a97fb68d":67};
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
