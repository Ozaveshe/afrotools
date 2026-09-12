'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1985-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1985-92-7ad5a931893f":"D","english-1985-93-561a2327aa05":"C","english-1985-94-9e88d2581c17":"D","english-1985-95-d2ce630c30dc":"A","english-1985-96-24331494ec62":"A","english-1984-1-3978ddc38bcc":"C","english-1984-2-1642ca5542e5":"B","english-1984-3-5c2b31bfc325":"D","english-1984-11-76777da6366d":"C","english-1984-13-2e7a736fbac8":"D","english-1984-14-ca2bd999a595":"A","english-1984-17-5b8657cad19c":"D","english-1984-18-97c4e17e6705":"A"};
const canonicalNumbers={"english-1985-92-7ad5a931893f":92,"english-1985-93-561a2327aa05":93,"english-1985-94-9e88d2581c17":94,"english-1985-95-d2ce630c30dc":95,"english-1985-96-24331494ec62":96,"english-1984-1-3978ddc38bcc":1,"english-1984-2-1642ca5542e5":2,"english-1984-3-5c2b31bfc325":3,"english-1984-11-76777da6366d":11,"english-1984-13-2e7a736fbac8":13,"english-1984-14-ca2bd999a595":14,"english-1984-17-5b8657cad19c":17,"english-1984-18-97c4e17e6705":18};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:8,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
