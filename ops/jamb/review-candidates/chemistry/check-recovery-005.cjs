'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {questionFingerprint,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./recovery-005.json'),integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
const expected=['chemistry-2002-23-227693af459a'];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(b.records.length,3);assert.equal(new Set(b.records.map(r=>r.id)).size,3);
assert.equal(JSON.stringify(b.integration_allowlist.map(r=>r.id).sort()),JSON.stringify([...expected].sort()));
assert.equal(b.assets.length,0);
for(const r of b.records){
 const file=path.join(__dirname,r.first_pass_file),source=JSON.parse(fs.readFileSync(file)).records.find(x=>x.id===r.id);
 assert.equal(hash(fs.readFileSync(file)),r.first_pass_file_sha256,r.id+' historical batch drift');
 assert.equal(source.publication_candidate,false,r.id+' was not held');
 const snapshot={...source,first_pass_file:r.first_pass_file};
 assert.equal(questionFingerprint(snapshot),r.first_pass_record_sha256,r.id+' historical record drift');
 assert.equal(questionFingerprint(r.first_pass_record),r.first_pass_record_sha256);
 assert.equal(questionFingerprint(r.original_record),r.original_content_sha256);
 const authorized=expected.includes(r.id);assert.equal(!!r.publication_candidate,authorized);
 const desired=integrated&&authorized?r.content_sha256:r.original_content_sha256;
 assert.equal(questionFingerprint(pool.find(q=>q.id===r.id)),desired,r.id+' '+(integrated?'integrated':'pre-intake')+' drift');
 if(!authorized){assert.ok(r.hold_reason.length>50);assert.ok(!r.candidate);continue;}
 const q=r.candidate;assert.equal(q.id,r.id);assert.equal(questionFingerprint(q),r.content_sha256);
 assert.ok(!Object.hasOwn(q,'verification_method'));assert.ok(!Object.hasOwn(q,'verified_at'));assert.equal(q.verification?.method,'ai-source-checked');assert.equal(q.verification?.reviewed_at,'2026-09-12');assert.equal(q.explanation,q.ai_explanation);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.ok(!/repair|typo|guessed|previous|source note|imported|without seeing|nearest.choice/i.test(q.question+' '+q.explanation));
 const reasons=assessQuestion(q,{questions:{[q.id]:{asset_review:r.asset_review}},sources:{}}).reasons;
 for(const reason of ['missing_visual_or_description','asset_review_missing','unsupported_visual_asset','asset_content_changed','incomplete_options','empty_option','duplicate_option_text','ocr_or_placeholder_artifact','explanation_requires_correction'])assert.ok(!reasons.includes(reason),q.id+':'+reason);
 if(q.image){const asset=b.assets.find(a=>a.id===r.id);assert.equal(q.image,asset.target_path);assert.equal(hash(fs.readFileSync(path.join(__dirname,asset.private_file))),asset.content_sha256);assert.equal(r.asset_review.content_sha256,asset.content_sha256);const svg=fs.readFileSync(path.join(__dirname,asset.private_file),'utf8');assert.ok(!/<script|<foreignObject|onload=|https?:\/\/(?!www.w3.org)/i.test(svg));assert.ok(!/exothermic|Charles|melting|boiling|sublimation|ideal gas|steepest|correct answer/i.test(svg+' '+q.image_alt));}
}
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf', pinned='d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75';
assert.equal(b.source_pdf_sha256,pinned);assert.equal(b.source.content_sha256,pinned);assert.equal(b.source.reuse_authorization.material_sha256,pinned);
if(fs.existsSync(pdf))assert.equal(hash(fs.readFileSync(pdf)),pinned);else assert.ok(integrated,'Pre-intake verification requires the original source PDF');
const priorFiles=['recovery-001.json','recovery-002.json','recovery-003.json','recovery-004.json'];
assert.equal(JSON.stringify(b.prior_recoveries.map(r=>r.file)),JSON.stringify(priorFiles));
const seen=new Set();
for(const entry of b.prior_recoveries){
 const previous=require('./'+entry.file);assert.equal(hash(fs.readFileSync(path.join(__dirname,entry.file))),entry.sha256);
 assert.equal(JSON.stringify(entry.integration_allowlist),JSON.stringify(previous.integration_allowlist));
 for(const r of previous.records){assert.ok(!b.records.some(n=>n.id===r.id),'Prior recovery ID repeated');}
 for(const r of entry.integration_allowlist){assert.ok(!seen.has(r.id));seen.add(r.id);assert.equal(questionFingerprint(pool.find(q=>q.id===r.id)),integrated?r.candidate_content_sha256:r.original_content_sha256,'Prior recovery drift '+r.id);}
}
assert.equal(seen.size,24);
const get=id=>b.records.find(r=>r.id===id).candidate;
assert.equal(get(expected[0]).answer,'C');assert.ok(get(expected[0]).options.C.includes('approximately'));
assert.equal(Math.round(1836.15267343/10)*10,1840);
assert.ok(Math.abs(80/((200/50)*Math.sqrt(32/16))-14.1421356237)<1e-9);
assert.equal(Math.min(10/100,0.2*1/2),0.1);
assert.equal(b.records[0].actual_source_year,1987);
console.log('Recovery005: 3 examined, 1 recovered, 2 held; exact 24 prior recoveries and independent checks passed.');
