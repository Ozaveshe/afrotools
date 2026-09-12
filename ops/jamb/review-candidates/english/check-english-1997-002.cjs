'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1997-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1997-13-2a505d2a44c6":"C","english-1997-14-5c43d0a68d43":"B","english-1997-15-d5be143b71b3":"D","english-1997-26-d4bfd58a0dcb":"B","english-1997-27-f21c665e15ac":"C","english-1997-28-d1a9cea98b2b":"C","english-1997-29-261244828b84":"D","english-1997-31-3f112b7e1335":"C","english-1997-33-a0cb5b43c532":"D","english-1997-35-061eb142d690":"B","english-1997-36-04313380a411":"C","english-1997-37-ff1ff3212c2f":"D","english-1997-38-81bba0d780ca":"B","english-1997-39-0fa7995035bd":"A","english-1997-40-889e837dc963":"B","english-1997-41-59edd1d09383":"B"};
const canonicalNumbers={"english-1997-13-2a505d2a44c6":13,"english-1997-14-5c43d0a68d43":14,"english-1997-15-d5be143b71b3":15,"english-1997-26-d4bfd58a0dcb":26,"english-1997-27-f21c665e15ac":27,"english-1997-28-d1a9cea98b2b":28,"english-1997-29-261244828b84":29,"english-1997-31-3f112b7e1335":31,"english-1997-33-a0cb5b43c532":33,"english-1997-35-061eb142d690":35,"english-1997-36-04313380a411":36,"english-1997-37-ff1ff3212c2f":37,"english-1997-38-81bba0d780ca":38,"english-1997-39-0fa7995035bd":39,"english-1997-40-889e837dc963":40,"english-1997-41-59edd1d09383":41};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:3,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
