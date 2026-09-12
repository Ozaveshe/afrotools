'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const batches=fs.readdirSync(__dirname).filter(f=>/^batch-\d{3}\.json$/.test(f)).sort();
const examined=[];
for(const file of batches){
 const b=JSON.parse(fs.readFileSync(path.join(__dirname,file)));
 for(const r of b.records)examined.push({id:r.id,batch_file:file,source_year:r.actual_source_year,source_number:r.actual_source_number,source_pdf_page:r.source_pdf_page,status:r.publication_candidate?'candidate-prepared':'held-for-repair',original_content_sha256:r.original_content_sha256,candidate_content_sha256:r.content_sha256||null,hold_reason:r.hold_reason||null,independently_indicated_answer:r.independently_indicated_answer||null});
}
assert.equal(new Set(examined.map(r=>r.id)).size,examined.length,'Do not double count a rereview as a new examined record');
const held=examined.filter(r=>r.status==='held-for-repair');
const inventory={schema_version:1,subject:'chemistry',updated_at:'2026-09-12',source_pdf_sha256:'d70da60adbad7d2c2b972ea2e71d33d9f5f512869f416aa73cbc8594c205bc75',scope:'Cumulative private review inventory. Candidate status does not establish integration or deployment. Held records remain part of the completion goal; later repairs must reference the same stable ID and preserve the initial evidence.',counts:{examined:examined.length,candidates_prepared:examined.length-held.length,held:held.length},examined_ids:examined.map(r=>r.id),held_ids:held.map(r=>r.id),records:examined,repair_policy:'Prioritise recoverable missing formulas, alternatives, shared passages and figures. Use the supplied PDF and corroborated originals. Recompute independently. Do not invent source values, silently drop unresolved records, or treat a held item as awaiting teacher or owner approval. Record a later resolution with the same ID, evidence and new fingerprint before changing held status.'};
const out=path.join(__dirname,'review-inventory.json');
const text=JSON.stringify(inventory,null,2)+'\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(out,'utf8'),text,'Review inventory is stale');else fs.writeFileSync(out,text);
console.log(inventory.counts);
