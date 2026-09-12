'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1999-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1999-49-100613488e5c":"D","english-1999-50-cbe8a2b69740":"A","english-1999-51-2abd6bcbf5e8":"C","english-1999-52-d28bf30ea6bf":"A","english-1999-55-7b1600ecff96":"C","english-1999-56-b3de4dcfd073":"D","english-1999-57-41155018fa27":"A","english-1999-58-666906643793":"B","english-1999-59-a337906ac130":"D","english-1999-61-29c3dda8ffe4":"B","english-1999-62-41bf58468d1a":"D","english-1999-63-e7e3cbdc0afb":"D","english-1999-64-32cc8ac40cb1":"B","english-1999-65-6ef93f768859":"A","english-1999-66-262f0203a442":"C","english-1999-67-e8047aafa85c":"D","english-1999-68-cdfde342f9b0":"B"};
const canonicalNumbers={"english-1999-49-100613488e5c":49,"english-1999-50-cbe8a2b69740":50,"english-1999-51-2abd6bcbf5e8":51,"english-1999-52-d28bf30ea6bf":52,"english-1999-55-7b1600ecff96":55,"english-1999-56-b3de4dcfd073":56,"english-1999-57-41155018fa27":57,"english-1999-58-666906643793":58,"english-1999-59-a337906ac130":59,"english-1999-61-29c3dda8ffe4":61,"english-1999-62-41bf58468d1a":62,"english-1999-63-e7e3cbdc0afb":63,"english-1999-64-32cc8ac40cb1":64,"english-1999-65-6ef93f768859":65,"english-1999-66-262f0203a442":66,"english-1999-67-e8047aafa85c":67,"english-1999-68-cdfde342f9b0":68};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:17,held:3,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
