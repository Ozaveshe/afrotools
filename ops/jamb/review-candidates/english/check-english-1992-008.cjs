'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-008.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-59-73fd584ab3b2":"C","english-1992-59-484dcc3d5366":"D","english-1992-60-32280efd263d":"A","english-1992-61-43007760ac8f":"C","english-1992-62-3e7a0de676ff":"B","english-1992-62-ce83123d920f":"D","english-1992-63-f29117336610":"D","english-1992-64-dc23fb6da287":"A"};
const canonicalNumbers={"english-1992-59-73fd584ab3b2":59,"english-1992-59-484dcc3d5366":59,"english-1992-60-32280efd263d":60,"english-1992-61-43007760ac8f":61,"english-1992-62-3e7a0de676ff":62,"english-1992-62-ce83123d920f":62,"english-1992-63-f29117336610":63,"english-1992-64-dc23fb6da287":64};
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
