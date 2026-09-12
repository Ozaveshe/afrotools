'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1985-002.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1985-52-978d89974054":"C","english-1985-53-da1fa8384954":"D","english-1985-54-1560c4c53f18":"A","english-1985-56-dbe932bee0ac":"C","english-1985-58-5931d0d15671":"A","english-1985-59-c9dcc193237d":"D","english-1985-60-ade3215eb308":"D","english-1985-61-d468e572f525":"B","english-1985-63-c7a343e1e9e5":"D","english-1985-64-e9e08dac8830":"C","english-1985-65-9a57aff783fc":"E","english-1985-66-8efdb12c2977":"C","english-1985-67-09ed50de0030":"D","english-1985-69-f88914be3a9e":"D","english-1985-70-4e17ba1782bc":"C","english-1985-71-8d3584057fe7":"D"};
const canonicalNumbers={"english-1985-52-978d89974054":52,"english-1985-53-da1fa8384954":53,"english-1985-54-1560c4c53f18":54,"english-1985-56-dbe932bee0ac":56,"english-1985-58-5931d0d15671":58,"english-1985-59-c9dcc193237d":59,"english-1985-60-ade3215eb308":60,"english-1985-61-d468e572f525":61,"english-1985-63-c7a343e1e9e5":63,"english-1985-64-e9e08dac8830":64,"english-1985-65-9a57aff783fc":65,"english-1985-66-8efdb12c2977":66,"english-1985-67-09ed50de0030":67,"english-1985-69-f88914be3a9e":69,"english-1985-70-4e17ba1782bc":70,"english-1985-71-8d3584057fe7":71};
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
