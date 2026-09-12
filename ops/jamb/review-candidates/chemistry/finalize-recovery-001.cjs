'use strict';
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {questionFingerprint}=require('../../../../scripts/lib/jamb-content-trust');
const file=path.join(__dirname,'recovery-001.json'),b=JSON.parse(fs.readFileSync(file));
b.source=JSON.parse(fs.readFileSync(path.join(__dirname,'batch-022.json'))).source;
for(const r of b.records){
 r.first_pass_file_sha256=crypto.createHash('sha256').update(fs.readFileSync(path.join(__dirname,r.first_pass_file))).digest('hex');
 r.first_pass_record_sha256=questionFingerprint(r.first_pass_record);
 if(r.publication_candidate)r.content_sha256=questionFingerprint(r.candidate);
}
b.integration_allowlist=b.records.filter(r=>r.publication_candidate).map(r=>({id:r.id,original_content_sha256:r.original_content_sha256,candidate_content_sha256:r.content_sha256}));
fs.writeFileSync(file,JSON.stringify(b,null,2)+'\n');
console.log(b.counts);
