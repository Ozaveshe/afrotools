'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-013.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-94-d41e4660af2c":"B","english-1992-94-31aef1a19f95":"C","english-1992-95-d19951d9f5b8":"D","english-1992-96-ce6704cad584":"D","english-1992-97-13240ce51f81":"B","english-1992-98-e551ce0168b3":"D","english-1992-98-319455a7efb1":"C","english-1992-98-dcb73ad9c05c":"D","english-1992-100-6a172426de60":"D"};
const canonicalNumbers={"english-1992-94-d41e4660af2c":94,"english-1992-94-31aef1a19f95":94,"english-1992-95-d19951d9f5b8":95,"english-1992-96-ce6704cad584":96,"english-1992-97-13240ce51f81":97,"english-1992-98-e551ce0168b3":98,"english-1992-98-319455a7efb1":98,"english-1992-98-dcb73ad9c05c":98,"english-1992-100-6a172426de60":100};
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
