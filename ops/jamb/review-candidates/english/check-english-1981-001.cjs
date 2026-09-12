'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1981-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1981-2-eac54fff2c74":"A","english-1981-3-ddcc62484af8":"A","english-1981-4-dea27cd1f385":"C","english-1981-6-fed5f881e4b6":"C","english-1981-7-1a0eb1debaa2":"C","english-1981-8-148a0288617b":"A","english-1981-17-fc7ebb14257c":"A","english-1981-18-c8c45c99ee38":"E","english-1981-19-b8a8498c3183":"B","english-1981-21-8a799dd37f1a":"C","english-1981-22-9244b2c29a07":"E","english-1981-23-d1cab62b511c":"D","english-1981-24-b436a5eecaff":"C"};
const canonicalNumbers={"english-1981-2-eac54fff2c74":2,"english-1981-3-ddcc62484af8":3,"english-1981-4-dea27cd1f385":4,"english-1981-6-fed5f881e4b6":6,"english-1981-7-1a0eb1debaa2":7,"english-1981-8-148a0288617b":8,"english-1981-17-fc7ebb14257c":17,"english-1981-18-c8c45c99ee38":18,"english-1981-19-b8a8498c3183":19,"english-1981-21-8a799dd37f1a":21,"english-1981-22-9244b2c29a07":22,"english-1981-23-d1cab62b511c":23,"english-1981-24-b436a5eecaff":24};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:13,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
