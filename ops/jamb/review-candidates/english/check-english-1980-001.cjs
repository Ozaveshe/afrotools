'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1980-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1980-39-7a151654b976":"B","english-1980-40-94f7a707bab3":"B","english-1980-45-3cd8b4314d04":"A","english-1980-46-1660278b71e0":"B","english-1980-47-92bf3698e1f4":"B","english-1980-48-ba8f2f747a2c":"A","english-1980-49-8cc8ecffcc28":"D","english-1980-55-bedeee6f9705":"C","english-1980-56-10654c36c8cb":"A"};
const canonicalNumbers={"english-1980-39-7a151654b976":39,"english-1980-40-94f7a707bab3":40,"english-1980-45-3cd8b4314d04":45,"english-1980-46-1660278b71e0":46,"english-1980-47-92bf3698e1f4":47,"english-1980-48-ba8f2f747a2c":48,"english-1980-49-8cc8ecffcc28":49,"english-1980-55-bedeee6f9705":55,"english-1980-56-10654c36c8cb":56};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:9,held:11,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
