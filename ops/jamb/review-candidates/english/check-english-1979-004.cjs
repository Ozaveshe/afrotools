'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1979-004.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1978-43-c751bc184adc":"A","english-1978-44-43445e7af14e":"A","english-1978-45-fd4aa29432a3":"D","english-1978-46-13f4c894f91c":"C","english-1978-47-a8dde8386a24":"D","english-1978-48-e345b43d5ee1":"E","english-1978-49-1fc1d1671b23":"D","english-1978-52-8b77fefdbc23":"E","english-1978-56-0a2d58ba0dd7":"B","english-1978-58-e09c31092a0b":"C","english-1978-59-a3083644baf2":"E"};
const canonicalNumbers={"english-1978-43-c751bc184adc":43,"english-1978-44-43445e7af14e":44,"english-1978-45-fd4aa29432a3":45,"english-1978-46-13f4c894f91c":46,"english-1978-47-a8dde8386a24":47,"english-1978-48-e345b43d5ee1":48,"english-1978-49-1fc1d1671b23":49,"english-1978-52-8b77fefdbc23":52,"english-1978-56-0a2d58ba0dd7":56,"english-1978-58-e09c31092a0b":58,"english-1978-59-a3083644baf2":59};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:11,held:9,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
