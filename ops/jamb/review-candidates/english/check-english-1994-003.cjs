'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1994-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1994-50-6570fe69fe8d":"B","english-1994-51-55eb99a50ed5":"A","english-1994-53-a1914ab14634":"D","english-1994-54-32a1b7122d0a":"C","english-1994-55-508ec3051bab":"A","english-1993-1-03fd230b4963":"A","english-1993-1-c2c094979f86":"B","english-1993-2-3d50ca2de6c7":"B","english-1993-3-40e8b85e893e":"A","english-1993-4-63bb5325fa59":"D","english-1993-6-26f9f96d6e3b":"C","english-1993-8-add4eb42791f":"C","english-1993-9-55b29d11a275":"D","english-1993-11-256132509d2c":"B","english-1993-14-d42ecbd06a66":"B"};
const canonicalNumbers={"english-1994-50-6570fe69fe8d":50,"english-1994-51-55eb99a50ed5":51,"english-1994-53-a1914ab14634":53,"english-1994-54-32a1b7122d0a":54,"english-1994-55-508ec3051bab":55,"english-1993-1-03fd230b4963":1,"english-1993-1-c2c094979f86":1,"english-1993-2-3d50ca2de6c7":2,"english-1993-3-40e8b85e893e":3,"english-1993-4-63bb5325fa59":4,"english-1993-6-26f9f96d6e3b":6,"english-1993-8-add4eb42791f":8,"english-1993-9-55b29d11a275":9,"english-1993-11-256132509d2c":11,"english-1993-14-d42ecbd06a66":14};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:15,held:5,passages:10,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
