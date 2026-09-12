'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1993-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1993-48-2e7205ccb7a7":"A","english-1993-49-ed62db642c1e":"B","english-1993-50-97907327f320":"B","english-1993-51-2dbc6cfdb176":"D","english-1993-53-451cd700bafa":"B","english-1993-54-a89ddfa4d7f5":"C","english-1993-55-5eb62d6a3147":"D","english-1993-56-88e58e91d3bd":"D","english-1993-57-6df8e77eec60":"A","english-1993-58-18623ce51622":"C","english-1993-59-97b1b1553014":"C","english-1993-60-e9873cee9d4f":"A","english-1993-61-9dd51b22c7d0":"D","english-1993-62-79361d6eb8e8":"A","english-1993-64-93aaa8718ea4":"D","english-1993-97-a57b92f1619e":"C"};
const canonicalNumbers={"english-1993-48-2e7205ccb7a7":48,"english-1993-49-ed62db642c1e":49,"english-1993-50-97907327f320":50,"english-1993-51-2dbc6cfdb176":51,"english-1993-53-451cd700bafa":53,"english-1993-54-a89ddfa4d7f5":54,"english-1993-55-5eb62d6a3147":55,"english-1993-56-88e58e91d3bd":56,"english-1993-57-6df8e77eec60":57,"english-1993-58-18623ce51622":58,"english-1993-59-97b1b1553014":59,"english-1993-60-e9873cee9d4f":60,"english-1993-61-9dd51b22c7d0":61,"english-1993-62-79361d6eb8e8":62,"english-1993-64-93aaa8718ea4":64,"english-1993-97-a57b92f1619e":97};
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
