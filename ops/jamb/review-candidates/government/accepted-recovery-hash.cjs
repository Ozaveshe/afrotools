'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {questionFingerprint:fp,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const read=f=>fs.readFileSync(path.join(__dirname,f)),hash=x=>crypto.createHash('sha256').update(x).digest('hex');
// Exact reviewed overlay only. Historical first-pass rows are never rewritten.
const bytes=read('recovery-001.json');assert.equal(hash(bytes),'b22b5d86b02c454537821841a8438a892637357c0fc467abc725b1229b109e74','Recovery manifest drift');
const batch=JSON.parse(bytes),sources=JSON.parse(read('sources.json'));assert.equal(hash(read('sources.json')),batch.sources_sha256,'Recovery sources drift');assert.deepEqual(batch.sources,sources);
const recovered=new Map(batch.records.filter(r=>r.publication_candidate).map(r=>[r.id,r]));
module.exports=function acceptedRecoveryHash(historical,current,ledger){
 if(historical.publication_candidate)return null;
 const r=recovered.get(historical.id);if(!r)return null;
 assert.equal(fp(historical),r.first_pass_record_sha256,'Recovery historical row drift');assert.equal(fp(historical.original_record),r.original_content_sha256,'Recovery original drift');
 const entry=ledger?.questions?.[r.id];if(!entry)return null;
 assert.ok(current,'Recovery current pool row required');assert.equal(fp(r.candidate),r.content_sha256,'Recovery candidate pin drift');assert.equal(fp(current),r.content_sha256,'Recovery pool drift');assert.equal(entry.content_sha256,r.content_sha256,'Recovery ledger fingerprint drift');assert.equal(entry.source_id,r.source_id,'Recovery source identity drift');
 const source=sources.find(s=>s.source_id===r.source_id),acceptedSource=ledger.sources?.[r.source_id];assert.ok(acceptedSource,'Recovery ledger source required');assert.equal(acceptedSource.content_sha256,source.sha256,'Recovery source hash drift');assert.equal(acceptedSource.source_file,source.filename,'Recovery source filename drift');
 for(const field of ['question_review','answer_review','explanation_review'])assert.equal(entry[field]?.status,'accepted','Recovery incomplete '+field);
 assert.equal(assessQuestion(current,ledger).state,'eligible','Recovery actual ledger eligibility required');return r.content_sha256;
};
