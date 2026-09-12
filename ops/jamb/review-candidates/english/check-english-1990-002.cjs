'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1990-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1990-34-60f0f1c1a53a":"A","english-1990-35-dae8b0894102":"C","english-1990-37-6f7064b51862":"A","english-1990-39-42963f1b08b3":"A","english-1990-40-423939431b91":"A","english-1990-41-3fb86ea77c88":"B","english-1990-42-16f8bd08adf3":"C","english-1990-44-5d502db50ba6":"C"};
const canonicalNumbers={"english-1990-34-60f0f1c1a53a":34,"english-1990-35-dae8b0894102":35,"english-1990-37-6f7064b51862":37,"english-1990-39-42963f1b08b3":39,"english-1990-40-423939431b91":40,"english-1990-41-3fb86ea77c88":41,"english-1990-42-16f8bd08adf3":42,"english-1990-44-5d502db50ba6":44};
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
