'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1986-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1986-17-1d5aeeb97e4d":"B","english-1986-19-f1d1d1af46a5":"C","english-1986-21-3c027e7614e9":"D","english-1986-22-1103ae8c14c9":"B","english-1986-23-50b9a2b243ab":"D","english-1986-24-0ddfff502fb0":"B","english-1986-25-520b02763534":"B"};
const canonicalNumbers={"english-1986-17-1d5aeeb97e4d":17,"english-1986-19-f1d1d1af46a5":19,"english-1986-21-3c027e7614e9":21,"english-1986-22-1103ae8c14c9":22,"english-1986-23-50b9a2b243ab":23,"english-1986-24-0ddfff502fb0":24,"english-1986-25-520b02763534":25};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:7,held:13,passages:7,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
