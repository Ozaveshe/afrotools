'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1997-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1998-97-90b636b9eac7":"A","english-1998-100-728e359bd184":"D","english-1997-2-d78cc9453800":"C","english-1997-3-ae0a3d7f61a8":"A","english-1997-4-490b73dbc7e6":"D","english-1997-6-a1be339bdb87":"D","english-1997-7-2765fd224edc":"A","english-1997-8-5aa64fb13dbd":"C","english-1997-9-33357fd4b9f9":"C","english-1997-11-51bdf6aa9164":"D","english-1997-12-9aaf1c155222":"A"};
const canonicalNumbers={"english-1998-97-90b636b9eac7":97,"english-1998-100-728e359bd184":100,"english-1997-2-d78cc9453800":2,"english-1997-3-ae0a3d7f61a8":3,"english-1997-4-490b73dbc7e6":4,"english-1997-6-a1be339bdb87":6,"english-1997-7-2765fd224edc":7,"english-1997-8-5aa64fb13dbd":8,"english-1997-9-33357fd4b9f9":9,"english-1997-11-51bdf6aa9164":11,"english-1997-12-9aaf1c155222":12};
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
