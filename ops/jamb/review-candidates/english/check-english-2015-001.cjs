'use strict';
const assert=require('node:assert/strict');
const path=require('node:path');
const batch=require('./english-2015-001.json');
const check=require('./check-candidate-integrity.cjs');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const keys={2015:{3:'A',5:'C',26:'B'},2016:{1:'C',2:'A',21:'D',22:'A'},2017:{3:'A',4:'B',5:'C',26:'A'}};
const excerpt='https://knowbaseconsult.com/wp-content/uploads/2014/10/the-last-days-at-forcados-college-excerpt.pdf';
function verify(pool,integrated=false){
 const live=new Map(pool.map(q=>[q.id,q])),ids=new Set();
 for(const year of [2015,2016,2017]){
  const records=batch.records.filter(r=>r.candidate.year===year);
  const held_records=year===2015?batch.held_records:[];
  check({...batch,records,held_records,examined_count:records.length+held_records.length},keys[year],held_records.length,year===2017?3:2);
 }
 for(const r of batch.records){
  assert.ok(!ids.has(r.id));ids.add(r.id);
  assert.deepEqual(live.get(r.id),integrated?r.candidate:r.original_record,`${r.id}: ${integrated?'integrated candidate':'original pool'} mismatch`);
  if(r.candidate.question.includes('Forcados')){
   assert.equal(r.semantic_review.source_url,excerpt);
   assert.match(r.semantic_review.source_locator,/^Chapter [12], PDF page/);
   assert.match(r.candidate.question,/A\. H\. Mohammed/);
  }
 }
 for(const h of batch.held_records){
  assert.ok(!ids.has(h.id));ids.add(h.id);
  assert.equal(questionFingerprint(live.get(h.id)),h.original_content_sha256,h.id+': held pool changed');
 }
 assert.equal(ids.size,40);
 return {passed:true,mode:integrated?'integrated':'pre-intake',examined:40,candidates:11,held:29,passages:7,scope:batch.checker_scope};
}
if(require.main===module){
 const pool=require(path.resolve(__dirname,'../../source-pool.json')).questions;
 process.stdout.write(JSON.stringify(verify(pool,process.argv.includes('--integrated')))+'\n');
}
module.exports={verify};
