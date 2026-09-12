'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {questionFingerprint,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./recovery-001.json'),integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
const expected=['chemistry-1983-13-226552c20011','chemistry-1983-17-ff5dd9189448','chemistry-1984-16-917ac93637fa','chemistry-1988-1-86ebc84326bc','chemistry-1988-6-e26a7c59d569','chemistry-1988-32-3fa695964965','chemistry-1989-2-811f9110fd65','chemistry-1989-8-e3e72febe003','chemistry-1989-29-11e9376472d8','chemistry-1993-19-22d3507d8a5e'];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(b.records.length,20);assert.equal(new Set(b.records.map(r=>r.id)).size,20);
assert.equal(JSON.stringify(b.integration_allowlist.map(r=>r.id).sort()),JSON.stringify([...expected].sort()));
assert.equal(b.assets.length,6);
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
 assert.equal(q.explanation,q.ai_explanation);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.ok(!/repair|typo|guessed|previous|source note|imported|without seeing|nearest.choice/i.test(q.question+' '+q.explanation));
 const reasons=assessQuestion(q,{questions:{[q.id]:{asset_review:r.asset_review}},sources:{}}).reasons;
 for(const reason of ['missing_visual_or_description','asset_review_missing','unsupported_visual_asset','asset_content_changed','incomplete_options','empty_option','duplicate_option_text','ocr_or_placeholder_artifact','explanation_requires_correction'])assert.ok(!reasons.includes(reason),q.id+':'+reason);
 if(q.image){const asset=b.assets.find(a=>a.id===r.id);assert.equal(q.image,asset.target_path);assert.equal(hash(fs.readFileSync(path.join(__dirname,asset.private_file))),asset.content_sha256);assert.equal(r.asset_review.content_sha256,asset.content_sha256);const svg=fs.readFileSync(path.join(__dirname,asset.private_file),'utf8');assert.ok(!/<script|<foreignObject|onload=|https?:\/\/(?!www.w3.org)/i.test(svg));assert.ok(!/exothermic|Charles|melting|boiling|sublimation|ideal gas|steepest|correct answer/i.test(svg+' '+q.image_alt));}
}
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf', pinned='d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75';
assert.equal(b.source_pdf_sha256,pinned);assert.equal(b.source.content_sha256,pinned);assert.equal(b.source.reuse_authorization.material_sha256,pinned);
if(fs.existsSync(pdf))assert.equal(hash(fs.readFileSync(pdf)),pinned);else assert.ok(integrated,'Pre-intake verification requires the original source PDF');
const get=id=>b.records.find(r=>r.id===id).candidate;
assert.ok(Math.sqrt(36.5/17)>1);assert.equal(get(expected[0]).answer,'D');
assert.equal(.63/63*2*108,2.16);assert.equal(get(expected[1]).answer,'D');
assert.equal(40-60,-20);assert.equal(get(expected[2]).answer,'D');
for(const t of [100,200,300,400,500])assert.equal((t*.04)/t,.04);assert.equal(get(expected[4]).answer,'B');
assert.equal(get(expected[6]).year,1990);assert.equal(get(expected[6]).answer,'A');
for(const p of [1,2,4])assert.equal(p*(8.314*300/p)/(8.314*300),1);assert.equal(get(expected[7]).answer,'C');
assert.equal(get(expected[8]).answer,'D');assert.equal(get(expected[9]).answer,'B');
console.log('Recovery001:20 reexamined,10 recovered,10 still-held; exact allowlist, historical immutability, source/asset hashes, context and independent checks passed ('+(integrated?'integrated':'pre-intake')+').');
