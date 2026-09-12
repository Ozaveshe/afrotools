'use strict';
// These assertions preserve reviewed content and provenance. They do not prove
// semantic correctness; the independent contextual review is recorded per item.
const assert = require('node:assert/strict');
const { questionFingerprint, assessQuestion } = require('../../../../scripts/lib/jamb-content-trust');
const batch = require('./english-2020-001.json');
const keys = {37:'C',38:'B',39:'C',40:'A',41:'A',43:'C',44:'B',45:'D'};
const ids = new Set();
for (const r of batch.records) {
  assert.ok(!ids.has(r.id)); ids.add(r.id);
  assert.equal(r.candidate.id, r.id);
  assert.equal(questionFingerprint(r.candidate), r.content_sha256);
  assert.equal(questionFingerprint(r.original_record), r.original_content_sha256);
  assert.equal(r.candidate.answer, keys[r.candidate.num]);
  assert.equal(r.candidate.verification.method, 'ai-source-checked');
  assert.ok(r.semantic_review.independent_reasoning.length > 80);
  assert.ok(r.semantic_review.support_summary.length > 20);
  assert.match(r.semantic_review.source_url, /^https:\/\/(?:www\.collinsdictionary\.com|our-languages\.canada\.ca|dictionary\.cambridge\.org)\//);
  assert.ok([684,685].includes(r.source_pdf_page));
  assert.doesNotMatch(JSON.stringify([r.candidate.question,r.candidate.options,r.candidate.explanation]), /Source note:|compilation|malformed|repair|supplied option|original key/i);
  assert.equal(r.candidate.explanation, r.candidate.ai_explanation);
  const review = {status:'accepted',reviewer:'Codex (AI)',reviewer_type:'ai',reviewed_at:'2026-09-12',evidence:'Candidate integrity fixture; see per-record contextual review.'};
  const ledger = {sources:{[batch.source_id]:batch.source},questions:{[r.id]:{content_sha256:r.content_sha256,source_id:batch.source_id,question_review:review,answer_review:review,explanation_review:review}}};
  assert.equal(assessQuestion(r.candidate,ledger).state,'eligible');
}
assert.equal(ids.size,8);
process.stdout.write(JSON.stringify({passed:true,question_ids:[...ids],scope:batch.checker_scope})+'\n');
