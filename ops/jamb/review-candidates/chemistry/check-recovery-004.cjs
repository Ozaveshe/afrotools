'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {questionFingerprint,assessQuestion}=require('../../../../scripts/lib/jamb-content-trust');
const b=require('./recovery-004.json'),integrated=process.argv.includes('--integrated');
const pool=JSON.parse(fs.readFileSync(path.join(__dirname,'../../source-pool.json'))).questions;
const expected=["chemistry-1988-35-627a1c1213ea", "chemistry-1989-6-535ca7d67eb1", "chemistry-1989-10-852ec5fa3e6d", "chemistry-1990-7-39772334f209", "chemistry-1998-37-b93f36da8f72"];
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
assert.equal(b.records.length,10);assert.equal(new Set(b.records.map(r=>r.id)).size,10);
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
 assert.equal(q.explanation,q.ai_explanation);assert.ok(q.options[q.answer]);assert.equal(q.format,Object.keys(q.options).length);
 assert.ok(!/repair|typo|guessed|previous|source note|imported|without seeing|nearest.choice/i.test(q.question+' '+q.explanation));
 const reasons=assessQuestion(q,{questions:{[q.id]:{asset_review:r.asset_review}},sources:{}}).reasons;
 for(const reason of ['missing_visual_or_description','asset_review_missing','unsupported_visual_asset','asset_content_changed','incomplete_options','empty_option','duplicate_option_text','ocr_or_placeholder_artifact','explanation_requires_correction'])assert.ok(!reasons.includes(reason),q.id+':'+reason);
 if(q.image){const asset=b.assets.find(a=>a.id===r.id);assert.equal(q.image,asset.target_path);assert.equal(hash(fs.readFileSync(path.join(__dirname,asset.private_file))),asset.content_sha256);assert.equal(r.asset_review.content_sha256,asset.content_sha256);const svg=fs.readFileSync(path.join(__dirname,asset.private_file),'utf8');assert.ok(!/<script|<foreignObject|onload=|https?:\/\/(?!www.w3.org)/i.test(svg));assert.ok(!/exothermic|Charles|melting|boiling|sublimation|ideal gas|steepest|correct answer/i.test(svg+' '+q.image_alt));}
}
const pdf='C:/Users/Oza/Documents/afrotools/.jamb/CHEMISTRY-JAMB-Past-Questions.pdf', pinned='d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75';
assert.equal(b.source_pdf_sha256,pinned);assert.equal(b.source.content_sha256,pinned);assert.equal(b.source.reuse_authorization.material_sha256,pinned);
if(fs.existsSync(pdf))assert.equal(hash(fs.readFileSync(pdf)),pinned);else assert.ok(integrated,'Pre-intake verification requires the original source PDF');
const priorFiles=['recovery-001.json','recovery-002.json','recovery-003.json'];
assert.equal(JSON.stringify(b.prior_recoveries.map(r=>r.file)),JSON.stringify(priorFiles));
const seen=new Set();
for(const entry of b.prior_recoveries){
 const previous=require('./'+entry.file);assert.equal(hash(fs.readFileSync(path.join(__dirname,entry.file))),entry.sha256);
 assert.equal(JSON.stringify(entry.integration_allowlist),JSON.stringify(previous.integration_allowlist));
 for(const r of previous.records){assert.ok(!b.records.some(n=>n.id===r.id),'Prior recovery ID repeated');}
 for(const r of entry.integration_allowlist){assert.ok(!seen.has(r.id));seen.add(r.id);assert.equal(questionFingerprint(pool.find(q=>q.id===r.id)),integrated?r.candidate_content_sha256:r.original_content_sha256,'Prior recovery drift '+r.id);}
}
assert.equal(seen.size,19);
const get=id=>b.records.find(r=>r.id===id).candidate;
assert.equal(760-23,737);assert.equal(get(expected[1]).answer,'A');assert.equal(get(expected[1]).options.D,'783 mmHg');
assert.equal(133-55,78);assert.equal(get(expected[2]).answer,'B');
const masses={CO:12+16,H2S:2+32,NO2:14+32,SO2:32+32};
assert.equal(Object.entries(masses).sort((a,b)=>1/Math.sqrt(b[1])-1/Math.sqrt(a[1])).map(x=>x[0]).join(','),'CO,H2S,NO2,SO2');assert.equal(get(expected[3]).answer,'D');
assert.deepEqual([2,4,12],[2,4,2+4*2+2]);assert.equal(get(expected[0]).answer,'C');
assert.equal(3+3*(-1),0);assert.equal(get(expected[4]).answer,'D');
assert.ok(Math.abs(0.9*364/(273*2)-0.6)<1e-12);assert.ok(![2,4.5,6,8.3].includes(0.6));
assert.ok(Math.abs(0.05/11-0.004545454545454545)<1e-12);assert.ok(![0.05,0.1,0.55,11].includes(0.05/11));
console.log('Recovery004: 10 reexamined, 5 recovered, 5 still held; historical fingerprints, 19 prior recoveries, source identity and independent checks passed ('+(integrated?'integrated':'pre-intake')+').');
