'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-1980-006.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={"2004":{},"2005":{},"2006":{}};
const keysById={"english-1979-49-e63f92497546":"C","english-1979-50-cd50206fc745":"D","english-1979-54-e4b913b38afb":"C","english-1979-56-fb348afc160c":"B","english-1979-57-27bb74674555":"B","english-1979-58-2abfa549c87f":"C","english-1979-59-3fd13cee6041":"B","english-1979-60-04577cc01455":"C","english-1979-61-895a172d6943":"B","english-1979-62-6ea2c88c0131":"D","english-1979-66-e6e306210eea":"A","english-1979-67-ca00aa4532d3":"C","english-1979-68-e7d94c98b59e":"E"};
const canonicalNumbers={"english-1979-49-e63f92497546":49,"english-1979-50-cd50206fc745":50,"english-1979-54-e4b913b38afb":54,"english-1979-56-fb348afc160c":56,"english-1979-57-27bb74674555":57,"english-1979-58-2abfa549c87f":58,"english-1979-59-3fd13cee6041":59,"english-1979-60-04577cc01455":60,"english-1979-61-895a172d6943":61,"english-1979-62-6ea2c88c0131":62,"english-1979-66-e6e306210eea":66,"english-1979-67-ca00aa4532d3":67,"english-1979-68-e7d94c98b59e":68};
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
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:20,candidates:13,held:7,passages:0,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
