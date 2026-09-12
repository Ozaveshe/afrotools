'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1991-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1991-68-d38b3114869d":"C","english-1991-69-a801b88e9164":"D","english-1991-70-3180676430e9":"A","english-1991-71-5babd00e795a":"B","english-1991-73-bb9417b42512":"D","english-1991-74-a0c6991a6612":"B","english-1991-75-cfbecdd49618":"B","english-1991-76-8cc4d244fac4":"A","english-1991-77-b82a4c6c5c0b":"A","english-1991-78-4b32cb18f62b":"B"};
const canonicalNumbers={"english-1991-68-d38b3114869d":68,"english-1991-69-a801b88e9164":69,"english-1991-70-3180676430e9":70,"english-1991-71-5babd00e795a":71,"english-1991-73-bb9417b42512":73,"english-1991-74-a0c6991a6612":74,"english-1991-75-cfbecdd49618":75,"english-1991-76-8cc4d244fac4":76,"english-1991-77-b82a4c6c5c0b":77,"english-1991-78-4b32cb18f62b":78};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:10,held:10,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
