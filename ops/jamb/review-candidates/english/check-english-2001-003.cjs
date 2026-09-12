'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2001-003.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-2001-84-d81b4a3940ab":"D","english-2001-85-effc2bdcc55a":"D","english-2001-86-4847cce9185d":"C","english-2001-87-5ace11e3fbe0":"C","english-2001-88-743b49f264a3":"D","english-2001-89-5d837db42743":"B","english-2001-90-fab9fd76132e":"A","english-2001-91-0aceec912d52":"D","english-2001-92-bdc9374f2312":"D","english-2001-93-33f6ba2abd95":"B","english-2001-94-612ef08a09a7":"D","english-2001-94-4e370cc3a065":"A","english-2001-95-ccabee92fefa":"A","english-2001-95-898ca636021d":"D","english-2001-96-9e1273f97060":"A","english-2001-96-879b6b4295bf":"D","english-2001-97-55e72fe0631e":"C","english-2001-98-c003160c4501":"B","english-2001-98-4de736784a64":"C","english-2001-99-1dd52989a072":"A"};
const canonicalNumbers={"english-2001-84-d81b4a3940ab":84,"english-2001-85-effc2bdcc55a":85,"english-2001-86-4847cce9185d":86,"english-2001-87-5ace11e3fbe0":87,"english-2001-88-743b49f264a3":88,"english-2001-89-5d837db42743":89,"english-2001-90-fab9fd76132e":90,"english-2001-91-0aceec912d52":91,"english-2001-92-bdc9374f2312":92,"english-2001-93-33f6ba2abd95":93,"english-2001-94-612ef08a09a7":75,"english-2001-94-4e370cc3a065":94,"english-2001-95-ccabee92fefa":78,"english-2001-95-898ca636021d":95,"english-2001-96-9e1273f97060":65,"english-2001-96-879b6b4295bf":96,"english-2001-97-55e72fe0631e":72,"english-2001-98-c003160c4501":70,"english-2001-98-4de736784a64":98,"english-2001-99-1dd52989a072":68};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:20,held:0,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
