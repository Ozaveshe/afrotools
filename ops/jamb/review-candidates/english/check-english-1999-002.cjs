'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1999-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1999-29-15d36cc1e04a":"D","english-1999-30-194eaf8a7a5e":"B","english-1999-31-7b1b78d1c97c":"C","english-1999-33-a4575e4dc7c0":"A","english-1999-34-bf88163161ed":"D","english-1999-35-91512b7ca9f1":"B","english-1999-36-5bdd3d4ecdd4":"C","english-1999-37-a6b7fc9f3286":"D","english-1999-38-44b2a096b609":"B","english-1999-39-19e477e89a5f":"A","english-1999-40-766d7654ec35":"D","english-1999-41-3d77df4069dd":"A","english-1999-42-eec32f473033":"C","english-1999-43-02d6a89d40b8":"A","english-1999-46-56758558f12b":"A","english-1999-48-d7cb5dcd1bdb":"B"};
const canonicalNumbers={"english-1999-29-15d36cc1e04a":29,"english-1999-30-194eaf8a7a5e":30,"english-1999-31-7b1b78d1c97c":31,"english-1999-33-a4575e4dc7c0":33,"english-1999-34-bf88163161ed":34,"english-1999-35-91512b7ca9f1":35,"english-1999-36-5bdd3d4ecdd4":36,"english-1999-37-a6b7fc9f3286":37,"english-1999-38-44b2a096b609":38,"english-1999-39-19e477e89a5f":39,"english-1999-40-766d7654ec35":40,"english-1999-41-3d77df4069dd":41,"english-1999-42-eec32f473033":42,"english-1999-43-02d6a89d40b8":43,"english-1999-46-56758558f12b":46,"english-1999-48-d7cb5dcd1bdb":48};
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
