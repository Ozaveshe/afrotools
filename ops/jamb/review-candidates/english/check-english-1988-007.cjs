'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1988-007.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1988-51-3983fba44e3b":"B","english-1988-52-54b9e4ac0c8c":"B","english-1988-53-b40bec8f1ac9":"D","english-1988-54-8b5826b18866":"B","english-1988-55-df9221890de1":"D","english-1988-56-5c640fdeeae4":"A","english-1988-57-e674e4d5b2bd":"C","english-1988-58-548ae50364d1":"B"};
const canonicalNumbers={"english-1988-51-3983fba44e3b":51,"english-1988-52-54b9e4ac0c8c":52,"english-1988-53-b40bec8f1ac9":53,"english-1988-54-8b5826b18866":54,"english-1988-55-df9221890de1":55,"english-1988-56-5c640fdeeae4":56,"english-1988-57-e674e4d5b2bd":57,"english-1988-58-548ae50364d1":58};
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
