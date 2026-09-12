'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1981-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1981-72-f1d64149eb45":"B","english-1981-74-e90dc1850d0a":"A","english-1981-75-212b70dfcb68":"C","english-1981-81-56b238ba961e":"E","english-1981-88-8840df6b3414":"D","english-1981-89-02b924465cc1":"E","english-1981-90-8209341cb733":"C","english-1981-91-e8662a55eef0":"E","english-1981-92-37150ce4f3e4":"A"};
const canonicalNumbers={"english-1981-72-f1d64149eb45":72,"english-1981-74-e90dc1850d0a":74,"english-1981-75-212b70dfcb68":75,"english-1981-81-56b238ba961e":81,"english-1981-88-8840df6b3414":88,"english-1981-89-02b924465cc1":89,"english-1981-90-8209341cb733":90,"english-1981-91-e8662a55eef0":91,"english-1981-92-37150ce4f3e4":92};
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
