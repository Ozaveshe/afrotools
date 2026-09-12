'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1982-018.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1982-95-22ff67ddda56":"A","english-1982-96-4f7676523253":"A","english-1982-98-58598c3e7a17":"C","english-1982-99-f56996c819b7":"A","english-1982-99-5f6d01fde4fb":"E","english-1982-99-34e1aac2821c":"D"};
const canonicalNumbers={"english-1982-95-22ff67ddda56":95,"english-1982-96-4f7676523253":96,"english-1982-98-58598c3e7a17":98,"english-1982-99-f56996c819b7":99,"english-1982-99-5f6d01fde4fb":99,"english-1982-99-34e1aac2821c":100};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:6,held:14,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
