'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1989-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1989-8-19516979d604":"B","english-1989-9-3bd1dda39ec4":"D","english-1989-11-d395eeafc463":"D","english-1989-12-54c58f693f76":"D","english-1989-16-38d3fe309f81":"C","english-1989-17-bd94d54fcd7e":"A","english-1989-18-b998a768c61e":"D","english-1989-19-152b96457c38":"C","english-1989-23-6196f7cb010c":"C","english-1989-24-dd259b1bb38e":"B","english-1989-25-d93def86b859":"C","english-1989-26-828f0fc7e12e":"A","english-1989-27-6e4934d6c6ab":"B","english-1989-28-108c81df0401":"C","english-1989-29-be1df6e6621f":"A","english-1989-30-c6b53e742710":"C","english-1989-31-f9574a800284":"B","english-1989-32-6f70ff6d8d4e":"D"};
const canonicalNumbers={"english-1989-8-19516979d604":8,"english-1989-9-3bd1dda39ec4":9,"english-1989-11-d395eeafc463":11,"english-1989-12-54c58f693f76":12,"english-1989-16-38d3fe309f81":16,"english-1989-17-bd94d54fcd7e":17,"english-1989-18-b998a768c61e":18,"english-1989-19-152b96457c38":19,"english-1989-23-6196f7cb010c":23,"english-1989-24-dd259b1bb38e":24,"english-1989-25-d93def86b859":25,"english-1989-26-828f0fc7e12e":26,"english-1989-27-6e4934d6c6ab":27,"english-1989-28-108c81df0401":28,"english-1989-29-be1df6e6621f":29,"english-1989-30-c6b53e742710":30,"english-1989-31-f9574a800284":31,"english-1989-32-6f70ff6d8d4e":32};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:18,held:2,passages:11,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
