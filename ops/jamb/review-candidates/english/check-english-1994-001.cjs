'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1994-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1995-85-002d7eec3c0e":"C","english-1995-87-6b621b0e09d2":"C","english-1995-94-bca38b820049":"A","english-1995-97-cfb1fab3effb":"D","english-1994-2-847a3cf8c2a3":"B","english-1994-3-7dd3c8e349b4":"A","english-1994-4-0c6c3c6614c6":"A","english-1994-6-c23d8cad2bd1":"B","english-1994-7-d2b494627ed1":"C","english-1994-8-617ba98bf645":"B","english-1994-11-6c84d18726e9":"D","english-1994-12-6f32b2506ad9":"C","english-1994-13-68765368cc7d":"B","english-1994-14-7d0ee30f3aa8":"C","english-1994-27-fe0e9dd45e1a":"D","english-1994-28-821003575591":"A"};
const canonicalNumbers={"english-1995-85-002d7eec3c0e":85,"english-1995-87-6b621b0e09d2":87,"english-1995-94-bca38b820049":94,"english-1995-97-cfb1fab3effb":97,"english-1994-2-847a3cf8c2a3":2,"english-1994-3-7dd3c8e349b4":3,"english-1994-4-0c6c3c6614c6":4,"english-1994-6-c23d8cad2bd1":6,"english-1994-7-d2b494627ed1":7,"english-1994-8-617ba98bf645":8,"english-1994-11-6c84d18726e9":11,"english-1994-12-6f32b2506ad9":12,"english-1994-13-68765368cc7d":13,"english-1994-14-7d0ee30f3aa8":14,"english-1994-27-fe0e9dd45e1a":27,"english-1994-28-821003575591":28};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:16,held:4,passages:10,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
