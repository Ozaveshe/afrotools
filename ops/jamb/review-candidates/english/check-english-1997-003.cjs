'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1997-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1997-43-9176d5e96ee3":"C","english-1997-44-31af31370901":"C","english-1997-45-25449c68e647":"A","english-1997-46-aeb8554817ff":"C","english-1997-47-e0c6cbc3bcc9":"C","english-1997-48-839124f4e429":"A","english-1997-49-9d22b8ab020d":"C","english-1997-50-4beadc7f567a":"A","english-1997-51-b7c3e4476b90":"B","english-1997-52-3d7279a55097":"A","english-1997-54-01fc6a1617b3":"D","english-1997-55-0d83ee0bf191":"D","english-1997-56-fa9ea6e716ab":"A","english-1997-57-8d0e1b5673b4":"A","english-1997-58-dce1e97241ac":"C","english-1997-59-359c511dc82f":"C","english-1997-61-435b86139029":"D","english-1997-62-35885608aef3":"C"};
const canonicalNumbers={"english-1997-43-9176d5e96ee3":43,"english-1997-44-31af31370901":44,"english-1997-45-25449c68e647":45,"english-1997-46-aeb8554817ff":46,"english-1997-47-e0c6cbc3bcc9":47,"english-1997-48-839124f4e429":48,"english-1997-49-9d22b8ab020d":49,"english-1997-50-4beadc7f567a":50,"english-1997-51-b7c3e4476b90":51,"english-1997-52-3d7279a55097":52,"english-1997-54-01fc6a1617b3":54,"english-1997-55-0d83ee0bf191":55,"english-1997-56-fa9ea6e716ab":56,"english-1997-57-8d0e1b5673b4":57,"english-1997-58-dce1e97241ac":58,"english-1997-59-359c511dc82f":59,"english-1997-61-435b86139029":61,"english-1997-62-35885608aef3":62};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:18,held:2,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
