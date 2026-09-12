'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1979-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1978-81-86d5632f796f":"C","english-1978-84-7aa6e3f9217d":"C","english-1978-85-f91b026de670":"D","english-1978-86-433243947427":"B","english-1978-87-5ec1f809df10":"B","english-1978-89-135442f68888":"C","english-1978-90-a6cebb0f800c":"E","english-1978-96-261625af6a05":"D","english-1978-98-ed2373eda09c":"A","english-1978-99-daffecf1eccf":"D","english-1978-100-ffa58fb27fa8":"C"};
const canonicalNumbers={"english-1978-81-86d5632f796f":81,"english-1978-84-7aa6e3f9217d":84,"english-1978-85-f91b026de670":85,"english-1978-86-433243947427":86,"english-1978-87-5ec1f809df10":87,"english-1978-89-135442f68888":89,"english-1978-90-a6cebb0f800c":90,"english-1978-96-261625af6a05":96,"english-1978-98-ed2373eda09c":98,"english-1978-99-daffecf1eccf":99,"english-1978-100-ffa58fb27fa8":100};
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
