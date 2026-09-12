'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-009.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-3-9a0a52945159":"C","english-1990-3-a15bab61812c":"A","english-1990-4-7cbf0660e322":"D","english-1990-6-cd9231cff5d7":"D","english-1990-7-24c84ec9ce84":"D","english-1990-8-4ed136dc21c1":"C","english-1990-9-7bca2432d660":"C","english-1990-11-23d6f445e1b5":"C","english-1990-12-063926e44450":"C","english-1990-13-8fdeb2c296c7":"A","english-1990-14-c28d6a1ef810":"B","english-1990-16-5b785e7a683f":"D","english-1990-18-bb6935613f73":"D"};
const canonicalNumbers={"english-1990-3-9a0a52945159":3,"english-1990-3-a15bab61812c":3,"english-1990-4-7cbf0660e322":4,"english-1990-6-cd9231cff5d7":6,"english-1990-7-24c84ec9ce84":7,"english-1990-8-4ed136dc21c1":8,"english-1990-9-7bca2432d660":9,"english-1990-11-23d6f445e1b5":11,"english-1990-12-063926e44450":12,"english-1990-13-8fdeb2c296c7":13,"english-1990-14-c28d6a1ef810":14,"english-1990-16-5b785e7a683f":16,"english-1990-18-bb6935613f73":18};
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
