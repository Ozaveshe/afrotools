'use strict';
// Verify the actual source bank against the independently reviewed candidates.
// Subject checkers preserve numerical proofs/provenance; they do not prove semantics.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const { questionFingerprint, assessQuestion } = require('../../../scripts/lib/jamb-content-trust');
module.exports = function check(filename) {
  const batch = JSON.parse(fs.readFileSync(path.join(__dirname, filename)));
  execFileSync(process.execPath, [path.join(root, batch.candidate_checker), '--integrated'], {cwd:root,encoding:'utf8',timeout:30000});
  const candidateBatch = JSON.parse(fs.readFileSync(path.join(root, batch.candidate_file)));
  const candidates = candidateBatch.records.filter(r => r.candidate);
  assert.deepEqual(batch.records.map(r=>r.id).sort(), candidates.map(r=>r.id).sort());
  const pool = JSON.parse(fs.readFileSync(path.join(root,'ops/jamb/source-pool.json'))).questions;
  const ledger = JSON.parse(fs.readFileSync(path.join(root,'data/jamb/review-ledger.json')));
  for (const r of batch.records) {
    const candidate = candidates.find(c=>c.id===r.id);
    const actual = pool.find(q=>q.id===r.id);
    assert.deepEqual(actual,candidate.candidate,r.id);
    assert.equal(questionFingerprint(actual),r.content_sha256,r.id);
    assert.equal(r.content_sha256,candidate.content_sha256,r.id);
    assert.equal(ledger.questions[r.id].content_sha256,r.content_sha256,r.id);
    assert.equal(assessQuestion(actual,ledger).state,'eligible',r.id);
  }
  process.stdout.write(JSON.stringify({passed:true,question_ids:batch.records.map(r=>r.id),scope:'Actual bank integrity, eligibility and subject evidence checks; no claim of mechanical proof for semantic judgments.'})+'\n');
};
