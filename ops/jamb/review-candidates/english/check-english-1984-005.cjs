'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1984-005.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1983-50-472b4be77154":"B","english-1983-54-1436a89f0eee":"E","english-1983-55-52fd58813f55":"B","english-1983-56-226e984a5ba9":"D","english-1983-57-8cbde9266a94":"C","english-1983-58-251235ea91dd":"D","english-1983-60-c484cdfd1b39":"A","english-1983-63-f48b6f4c0df7":"A","english-1983-64-4ce4595ac872":"C","english-1983-65-4344bd6288f7":"D","english-1983-66-db08c98b2c73":"E","english-1983-68-d6859be2b1e7":"A"};
const canonicalNumbers={"english-1983-50-472b4be77154":50,"english-1983-54-1436a89f0eee":54,"english-1983-55-52fd58813f55":55,"english-1983-56-226e984a5ba9":56,"english-1983-57-8cbde9266a94":57,"english-1983-58-251235ea91dd":58,"english-1983-60-c484cdfd1b39":60,"english-1983-63-f48b6f4c0df7":63,"english-1983-64-4ce4595ac872":64,"english-1983-65-4344bd6288f7":65,"english-1983-66-db08c98b2c73":66,"english-1983-68-d6859be2b1e7":68};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
