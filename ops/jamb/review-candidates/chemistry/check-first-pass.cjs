'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const inventory=require('./review-inventory.json');
const integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions.filter(q=>q.subject==='chemistry');
const batchFiles=fs.readdirSync(__dirname).filter(f=>/^batch-\d{3}\.json$/.test(f)).sort();
assert.equal(batchFiles.length,22);
const records=batchFiles.flatMap(file=>JSON.parse(fs.readFileSync(path.join(__dirname,file))).records);
assert.equal(records.length,850);assert.equal(new Set(records.map(r=>r.id)).size,850);
assert.equal(JSON.stringify(records.map(r=>r.id).sort()),JSON.stringify(pool.map(q=>q.id).sort()));
assert.equal(inventory.counts.examined,850);assert.equal(inventory.counts.candidates_prepared,572);assert.equal(inventory.counts.held,278);
assert.equal(records.filter(r=>r.publication_candidate).length,572);
assert.equal(records.filter(r=>!r.publication_candidate).length,278);
for(const r of records){
 const original=r.original_record;assert.ok(original,r.id+' original missing');
 assert.equal(questionFingerprint(original),r.original_content_sha256,r.id+' original hash');
 const expected=integrated&&r.publication_candidate?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(pool.find(q=>q.id===r.id)),expected,r.id+' pool drift');
 if(r.publication_candidate){assert.equal(questionFingerprint(r.candidate),r.content_sha256,r.id+' candidate hash');assert.equal(r.candidate.id,r.id);}
 else assert.ok(r.hold_reason,r.id+' held reason missing');
}
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf';
assert.equal(require('node:crypto').createHash('sha256').update(fs.readFileSync(pdf)).digest('hex'),inventory.source_pdf_sha256);
console.log('Chemistry first pass:850 unique IDs exactly cover pool;572 candidates and278 held with complete fingerprints/reasons; '+(integrated?'integrated':'pre-intake')+' check passed.');
