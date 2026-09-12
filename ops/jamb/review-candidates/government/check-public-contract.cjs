'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = path.resolve(process.argv[2]);
const first = Number(process.argv[3] || 21);
const last = Number(process.argv[4] || 24);
const trust = require(path.join(root, 'scripts/lib/jamb-content-trust'));
const liveLedger = JSON.parse(fs.readFileSync(path.join(root, 'data/jamb/review-ledger.json')));
// Temporary in-memory review records only. Never mutate the coordinator ledger.
const ledger = { sources: liveLedger.sources, questions: {} };
let examined = 0;
for (let i = first; i <= last; i++) {
  const id = String(i).padStart(3, '0');
  const batch = JSON.parse(fs.readFileSync(path.join(__dirname, 'batch-' + id + '.json')));
  for (const r of batch.records.filter(row => row.publication_candidate)) {
    const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewer_type: 'ai', reviewed_at: r.source_checked_at, evidence: 'Private candidate ' + id + '#' + r.id };
    ledger.questions[r.id] = { content_sha256: trust.questionFingerprint(r.candidate), source_id: r.source_id, question_review: review, answer_review: review, explanation_review: review };
    const result = trust.assessQuestion(r.candidate, ledger);
    assert.equal(result.state, 'eligible', r.id + ': ' + result.reasons.join(', '));
    const bad = structuredClone(r.candidate);
    bad.options.B = bad.options.A;
    ledger.questions[r.id].content_sha256 = trust.questionFingerprint(bad);
    assert.ok(trust.assessQuestion(bad, ledger).reasons.includes('duplicate_option_text'), 'Duplicate-option negative failed');
    examined++;
  }
}
console.log(JSON.stringify({ first, last, candidates: examined, eligible: examined, duplicate_option_negatives: examined }));
