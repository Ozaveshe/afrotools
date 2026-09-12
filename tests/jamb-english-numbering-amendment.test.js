'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const dir=path.resolve(__dirname,'../ops/jamb/review-candidates/english');
const {questionFingerprint}=require('../scripts/lib/jamb-content-trust');
test('primary numbering reconciliation keeps ten stable identities and private source evidence',()=>{
 const mapping=require('../ops/jamb/review-candidates/english/source-numbering-collisions-2004.json').resolution.mappings;
 const records=fs.readdirSync(dir).filter(f=>/^english.*json$/.test(f)).flatMap(f=>JSON.parse(fs.readFileSync(path.join(dir,f))).records);
 assert.equal(mapping.length,10);
 for(const m of mapping){
  const r=records.find(r=>r.id===m.id),history=r.numbering_amendment_history.at(-1);
  assert.equal(r.candidate.num,m.num);
  assert.equal(r.original_record.id,r.candidate.id);
  assert.equal(r.content_sha256,questionFingerprint(r.candidate));
  assert.equal(r.original_content_sha256,questionFingerprint(r.original_record));
  assert.equal(history.secondary_printed_num,r.original_record.num);
  assert.deepEqual(history.secondary_options,r.original_record.options);
  assert.deepEqual(history.primary_pages,m.pages);
  assert.notEqual(history.previous_content_sha256,r.content_sha256);
  assert.equal(records.filter(other=>other.candidate.year===2004&&other.candidate.num===m.num).length,1);
 }
});
