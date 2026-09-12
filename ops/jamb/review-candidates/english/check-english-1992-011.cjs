'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1992-011.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1992-79-7709da6f94e6":"B","english-1992-79-e29bba01255c":"C","english-1992-80-e7029012baff":"A","english-1992-80-d218b32cc591":"A","english-1992-81-7044d4ffdb5d":"C","english-1992-82-a0b63afba7f4":"C","english-1992-82-55816df93682":"C","english-1992-83-5386270d5beb":"D","english-1992-84-ab4031a48a7d":"B","english-1992-85-973fc77ef488":"A","english-1992-85-a880de6888a4":"C","english-1992-85-3a0ca925f671":"A"};
const canonicalNumbers={"english-1992-79-7709da6f94e6":79,"english-1992-79-e29bba01255c":79,"english-1992-80-e7029012baff":80,"english-1992-80-d218b32cc591":80,"english-1992-81-7044d4ffdb5d":81,"english-1992-82-a0b63afba7f4":82,"english-1992-82-55816df93682":82,"english-1992-83-5386270d5beb":83,"english-1992-84-ab4031a48a7d":84,"english-1992-85-973fc77ef488":85,"english-1992-85-a880de6888a4":85,"english-1992-85-3a0ca925f671":85};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:12,held:8,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
