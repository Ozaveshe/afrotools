'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1979-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1979-89-743bdc8ed1c4":"B","english-1979-92-9df3253a2425":"E","english-1979-93-4d279391fb74":"B","english-1978-3-54e588e709b6":"D","english-1978-4-fac9a7ba7b2e":"E","english-1978-6-0812ce83ad55":"A","english-1978-8-aee391379cf4":"A","english-1978-11-661dc1d819d2":"D","english-1978-13-c40e61640a64":"A","english-1978-14-459ff2c40164":"E"};
const canonicalNumbers={"english-1979-89-743bdc8ed1c4":89,"english-1979-92-9df3253a2425":92,"english-1979-93-4d279391fb74":93,"english-1978-3-54e588e709b6":3,"english-1978-4-fac9a7ba7b2e":4,"english-1978-6-0812ce83ad55":6,"english-1978-8-aee391379cf4":8,"english-1978-11-661dc1d819d2":11,"english-1978-13-c40e61640a64":13,"english-1978-14-459ff2c40164":14};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:7,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
