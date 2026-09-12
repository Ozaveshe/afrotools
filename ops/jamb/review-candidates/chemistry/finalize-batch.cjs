'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { questionFingerprint } = require('../../../..//scripts/lib/jamb-content-trust');
const file = path.join(__dirname, process.argv[2] || 'batch-001.json');
const b = JSON.parse(fs.readFileSync(file));
b.status = 'candidate-only';
b.source_id = 'owner-supplied-chemistry-1983-2004';
b.source = {
  source_file: b.source_file, content_sha256: b.source_pdf_sha256,
  source_year_status: 'compilation-labelled-years-not-officially-authenticated',
  pages: [...new Set(b.records.map(r => r.source_pdf_page))].sort((a,b)=>a-b),
  status: 'prepared for coordinator intake; not published', official_answer_key: false,
  reuse_authorization: { status: 'authorized-by-owner', basis: 'user-provided-material',
    scope: 'AfroTools past-question practice', material_sha256: b.source_pdf_sha256,
    authorized_by: 'AfroTools owner', authorized_at: '2026-09-12',
    instruction_ref: 'Owner supplied past-question reuse and independent AI verification instruction in this task.' }
};
for (const r of b.records) {
  r.original_record = r.before; delete r.before;
  r.original_content_sha256 = questionFingerprint(r.original_record);
  if (!r.publication_candidate) continue;
  r.candidate = r.update; delete r.update;
  r.candidate.explanation = r.candidate.ai_explanation;
  r.candidate.verification = { method:r.review_method, reviewed_at:b.reviewed_at };
  r.content_sha256 = questionFingerprint(r.candidate);
  r.repair_history = r.private_repair_history; delete r.private_repair_history;
  if (r.candidate.num === 22 && r.candidate.year === 1983) {
    r.source_urls = ['https://issr.edu.kh/science/Webpage/Lab_Techniques/Edexcel%20Practical%20Chemistry%20-%20Halesowen/Edexcel2009/efflorescence.htm'];
    r.repair_history = 'Restored sodium sulfate name and hydrate dot; independently distinguished water loss from moisture absorption, corroborated by school laboratory definition.';
  }
  if (r.candidate.num === 48 && r.candidate.year === 1983) r.source_urls.push('https://edu.rsc.org/cpd/rates-of-reactions/2000010.article');
  r.semantic_review = { source_url:r.source_urls[0], source_urls:r.source_urls,
    source_checked_at:r.source_checked_at, independent_reasoning:r.independent_reasoning,
    reviewer:'Codex (AI)', method:r.review_method,
    limitations:'Independent AI chemistry reasoning with supplied PDF and cited teaching/reference material; no official answer key or teacher approval. Automated checks validate recorded arithmetic and content integrity, not all conceptual chemistry.' };
}
b.checker_scope = 'Independent arithmetic, atom conservation and content/provenance integrity. Conceptual chemistry uses recorded independent reasoning and citations; passing code is not a scientific authority.';
fs.writeFileSync(file, JSON.stringify(b,null,2)+'\n');
console.log(b.counts);
