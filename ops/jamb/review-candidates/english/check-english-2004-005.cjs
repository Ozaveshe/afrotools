'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2004-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keysById={"english-2004-72-897eafd33ac0":"C","english-2004-72-8518d200e3d4":"D","english-2004-73-8eccab8d7603":"B","english-2004-73-243e2d689b52":"D","english-2004-73-d5eb0f66da28":"A","english-2004-74-3e92514ce77d":"A","english-2004-74-b61b7807c5ec":"C","english-2004-74-4654b9592c5a":"C","english-2004-76-881c8c61bf64":"C","english-2004-76-863c7c931177":"D","english-2004-77-91303ee20115":"D"};
const canonicalNumbers={"english-2004-72-897eafd33ac0":72,"english-2004-72-8518d200e3d4":72,"english-2004-73-8eccab8d7603":78,"english-2004-73-243e2d689b52":73,"english-2004-73-d5eb0f66da28":73,"english-2004-74-3e92514ce77d":79,"english-2004-74-b61b7807c5ec":74,"english-2004-74-4654b9592c5a":74,"english-2004-76-881c8c61bf64":76,"english-2004-76-863c7c931177":76,"english-2004-77-91303ee20115":77};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ assert.equal(r.candidate.num,canonicalNumbers[r.id],r.id+': canonical source number changed'); check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,0); }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);

 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,20);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:11,held:9,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
