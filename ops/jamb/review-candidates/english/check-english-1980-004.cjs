'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1980-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1979-2-1a2d5653b234":"E","english-1979-5-e1bba211f8da":"D","english-1979-7-c74ab7fa29eb":"E","english-1979-8-67f0cdb869b5":"B","english-1979-9-a4856372e80c":"C","english-1979-18-5900e4a48e93":"E","english-1979-21-cfdd7d09a483":"B","english-1979-23-3422d0bde354":"D","english-1979-24-fa692c2f07a0":"E","english-1979-26-1188adb7ebfc":"C","english-1979-27-276e11618dfa":"A"};
const canonicalNumbers={"english-1979-2-1a2d5653b234":2,"english-1979-5-e1bba211f8da":5,"english-1979-7-c74ab7fa29eb":7,"english-1979-8-67f0cdb869b5":8,"english-1979-9-a4856372e80c":9,"english-1979-18-5900e4a48e93":18,"english-1979-21-cfdd7d09a483":21,"english-1979-23-3422d0bde354":23,"english-1979-24-fa692c2f07a0":24,"english-1979-26-1188adb7ebfc":26,"english-1979-27-276e11618dfa":27};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:11,held:9,passages:9,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
