'use strict';
// Content/provenance integrity only. The language decisions are documented AI
// judgments supported by primary references, not mechanically proven meanings.
const assert = require('node:assert/strict');
const { questionFingerprint, assessQuestion } = require('../../../../scripts/lib/jamb-content-trust');
const batch = require('./english-2020-002.json');
const keys = {46:'A',47:'A',50:'A',51:'A',53:'A',55:'A',61:'A',64:'A',65:'A',68:'B',69:'B',70:'C',71:'C'};
const allowedHosts = new Set(['www.collinsdictionary.com','owl.purdue.edu','dictionary.cambridge.org','learnenglish.britishcouncil.org']);
const ids = new Set();
for (const r of batch.records) {
  assert.ok(!ids.has(r.id)); ids.add(r.id);
  assert.equal(r.candidate.id, r.id);
  assert.equal(questionFingerprint(r.candidate), r.content_sha256);
  assert.equal(questionFingerprint(r.original_record), r.original_content_sha256);
  assert.equal(r.candidate.answer, keys[r.candidate.num]);
  assert.equal(r.candidate.verification.method,'ai-source-checked');
  assert.equal(r.candidate.explanation,r.candidate.ai_explanation);
  assert.ok(r.semantic_review.independent_reasoning.length > 80);
  assert.ok(r.semantic_review.support_summary.length > 20);
  const url = new URL(r.semantic_review.source_url);
  assert.equal(url.protocol,'https:');assert.ok(allowedHosts.has(url.hostname));
  assert.ok([686,687,688,689].includes(r.source_pdf_page));
  assert.doesNotMatch(JSON.stringify([r.candidate.question,r.candidate.options,r.candidate.explanation]), /Source note:|compilation|malformed|repair|supplied option|original key/i);
  const review={status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-12',evidence:'Candidate integrity fixture; per-record contextual review accompanies this checker.'};
  const ledger={sources:{[batch.source_id]:batch.source},questions:{[r.id]:{content_sha256:r.content_sha256,source_id:batch.source_id,question_review:review,answer_review:review,explanation_review:review}}};
  assert.equal(assessQuestion(r.candidate,ledger).state,'eligible');
}
assert.equal(ids.size,13);
assert.equal(batch.held_records.length,8);
assert.equal(batch.examined_count,21);
for(const held of batch.held_records){assert.ok(!ids.has(held.id));assert.equal(held.status,'needs-source-reconciliation');assert.ok(held.reason.length>60);}
process.stdout.write(JSON.stringify({passed:true,question_ids:[...ids],examined:21,held:8,scope:batch.checker_scope})+'\n');
