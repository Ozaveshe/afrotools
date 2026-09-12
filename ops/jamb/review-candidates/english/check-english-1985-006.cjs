'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1985-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1984-43-e66e499e1d6f":"D","english-1984-44-a7f4dc86a0ad":"C","english-1984-45-2468c26977f7":"B","english-1984-46-1b3caf4e9d1a":"A","english-1984-48-bbe09367a4ad":"C","english-1984-50-a44c3cbc6daa":"B","english-1984-51-d54716cbf848":"E","english-1984-52-8454d9b6282e":"A","english-1984-53-07097118a3d5":"D","english-1984-56-e1ad2cf29596":"B","english-1984-57-f44a67aba767":"B","english-1984-58-474a22bca623":"B","english-1984-59-5cc8851e3315":"A","english-1984-60-01388c12868f":"D","english-1984-61-0a8005b55156":"C","english-1984-62-07e70eb7517c":"D"};
const canonicalNumbers={"english-1984-43-e66e499e1d6f":43,"english-1984-44-a7f4dc86a0ad":44,"english-1984-45-2468c26977f7":45,"english-1984-46-1b3caf4e9d1a":46,"english-1984-48-bbe09367a4ad":48,"english-1984-50-a44c3cbc6daa":50,"english-1984-51-d54716cbf848":51,"english-1984-52-8454d9b6282e":52,"english-1984-53-07097118a3d5":53,"english-1984-56-e1ad2cf29596":56,"english-1984-57-f44a67aba767":57,"english-1984-58-474a22bca623":58,"english-1984-59-5cc8851e3315":59,"english-1984-60-01388c12868f":60,"english-1984-61-0a8005b55156":61,"english-1984-62-07e70eb7517c":62};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
