'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1981-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1981-49-68d1ce926c01":"B","english-1981-51-d4b050958f86":"D","english-1981-53-7e9dd5c12bd4":"B","english-1981-54-ac6a6b3bacdc":"B","english-1981-57-9142b42332f9":"C","english-1981-58-4e49d311f09c":"D","english-1981-60-67c2f03c68ec":"A","english-1981-61-7997c75c2389":"E","english-1981-66-2aab9f9a086c":"A","english-1981-70-b4979fa8556f":"A"};
const canonicalNumbers={"english-1981-49-68d1ce926c01":49,"english-1981-51-d4b050958f86":51,"english-1981-53-7e9dd5c12bd4":53,"english-1981-54-ac6a6b3bacdc":54,"english-1981-57-9142b42332f9":57,"english-1981-58-4e49d311f09c":58,"english-1981-60-67c2f03c68ec":60,"english-1981-61-7997c75c2389":61,"english-1981-66-2aab9f9a086c":66,"english-1981-70-b4979fa8556f":70};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
