'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1995-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1995-53-1780c50f54e5":"D","english-1995-54-f4dd98844479":"B","english-1995-55-9e8f45dfc018":"B","english-1995-56-1c84c414999d":"C","english-1995-57-435c7b08d4d5":"A","english-1995-59-c0ca32de8ffa":"C","english-1995-60-ec9dfc77a275":"B","english-1995-61-15b3fa3c85ba":"C"};
const canonicalNumbers={"english-1995-53-1780c50f54e5":53,"english-1995-54-f4dd98844479":54,"english-1995-55-9e8f45dfc018":55,"english-1995-56-1c84c414999d":56,"english-1995-57-435c7b08d4d5":57,"english-1995-59-c0ca32de8ffa":59,"english-1995-60-ec9dfc77a275":60,"english-1995-61-15b3fa3c85ba":61};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:8,held:12,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
