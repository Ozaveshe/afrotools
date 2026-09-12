'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-008.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1991-90-1d649f511f88":"B","english-1991-92-33f050d62229":"B","english-1991-94-746ce422eb9e":"C","english-1991-96-679434d610aa":"D","english-1990-1-869222837e3a":"C","english-1990-2-2cd45e7ff1cf":"B"};
const canonicalNumbers={"english-1991-90-1d649f511f88":90,"english-1991-92-33f050d62229":92,"english-1991-94-746ce422eb9e":94,"english-1991-96-679434d610aa":96,"english-1990-1-869222837e3a":1,"english-1990-2-2cd45e7ff1cf":2};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:6,held:14,passages:2,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
