'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-010.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-73-3afe77421fb9":"C","english-1992-73-e4de0af80755":"D","english-1992-74-f92823122865":"A","english-1992-74-9ed86ca4c808":"A","english-1992-75-6fd2fa38bd50":"C","english-1992-75-7fdadac3e346":"B","english-1992-75-d10d34c6c4ec":"D","english-1992-76-9989a2885ed6":"A","english-1992-78-140e9de0bbc2":"A","english-1992-78-4c8ad315b865":"C","english-1992-78-525b4fa087f8":"A","english-1992-79-2ddf9a02a8a4":"C"};
const canonicalNumbers={"english-1992-73-3afe77421fb9":73,"english-1992-73-e4de0af80755":73,"english-1992-74-f92823122865":74,"english-1992-74-9ed86ca4c808":74,"english-1992-75-6fd2fa38bd50":75,"english-1992-75-7fdadac3e346":75,"english-1992-75-d10d34c6c4ec":75,"english-1992-76-9989a2885ed6":76,"english-1992-78-140e9de0bbc2":78,"english-1992-78-4c8ad315b865":78,"english-1992-78-525b4fa087f8":78,"english-1992-79-2ddf9a02a8a4":79};
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const r of batch.records){ assert.equal(r.candidate.num,canonicalNumbers[r.id]); check({...batch,records:[r],held_records:[],examined_count:1},{[r.candidate.num]:keysById[r.id]},0,0); }
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
