'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1988-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1988-18-e4944e86d97e":"B","english-1988-19-5190c851f767":"C","english-1988-21-c254018dbb34":"B","english-1988-22-840523ca3d81":"A","english-1988-22-68f5b0e5ec7a":"A","english-1988-23-e0430413021a":"C","english-1988-24-bb6077441d10":"B","english-1988-25-9e57bdc5554f":"D","english-1988-27-27a5eb22be8e":"C","english-1988-28-f93f10aecbab":"A"};
const canonicalNumbers={"english-1988-18-e4944e86d97e":18,"english-1988-19-5190c851f767":19,"english-1988-21-c254018dbb34":21,"english-1988-22-840523ca3d81":22,"english-1988-22-68f5b0e5ec7a":22,"english-1988-23-e0430413021a":23,"english-1988-24-bb6077441d10":24,"english-1988-25-9e57bdc5554f":25,"english-1988-27-27a5eb22be8e":27,"english-1988-28-f93f10aecbab":28};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:8,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
