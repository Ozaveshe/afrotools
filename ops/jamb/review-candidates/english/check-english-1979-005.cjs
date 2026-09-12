'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1979-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1978-61-708640d276cb":"D","english-1978-63-93fb4a66b131":"C","english-1978-64-fcd10942ac8c":"C","english-1978-65-51f2a8c1c6f6":"B","english-1978-66-6d3c8477c062":"D","english-1978-67-4a13f0baaddb":"D","english-1978-68-5e3dc1a530ad":"C","english-1978-70-ecf19badcfc7":"B","english-1978-76-97b100b4b672":"D","english-1978-78-a052f2e05729":"C","english-1978-80-e20f5202c31f":"B"};
const canonicalNumbers={"english-1978-61-708640d276cb":61,"english-1978-63-93fb4a66b131":63,"english-1978-64-fcd10942ac8c":64,"english-1978-65-51f2a8c1c6f6":65,"english-1978-66-6d3c8477c062":66,"english-1978-67-4a13f0baaddb":67,"english-1978-68-5e3dc1a530ad":68,"english-1978-70-ecf19badcfc7":70,"english-1978-76-97b100b4b672":76,"english-1978-78-a052f2e05729":78,"english-1978-80-e20f5202c31f":80};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:11,held:9,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
