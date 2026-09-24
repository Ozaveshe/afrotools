'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const evidenceDir = path.join(root, 'ops/jamb/verification');
const { assessQuestion } = require('../scripts/lib/jamb-content-trust');
const batches = fs.readdirSync(evidenceDir).filter(name => /^[a-z]+-\d{4}-publishable-\d{3}\.json$/.test(name));

test('student explanations contain learning content instead of internal repair history', () => {
  const bank = JSON.parse(fs.readFileSync(path.join(root, 'data/jamb/pools/practice-pool.json'), 'utf8'));
  for (const question of bank.questions) {
    assert.doesNotMatch(question.explanation || question.ai_explanation || '', /source note:|supplied (?:compilation|paper|PDF)|(?:repaired|corrupted|damaged) (?:source |cubic |text |)?transcription|imported (?:text|option)|source (?:copy printing|transcription was repaired)|(?:has|have|were|was) been restored/i, question.id);
  }
});

test('AI reviews are backed by current batch evidence and reproducible integrity checks', () => {
  const ledger = JSON.parse(fs.readFileSync(path.join(root, 'data/jamb/review-ledger.json'), 'utf8'));
  const pool = JSON.parse(fs.readFileSync(path.join(root, 'ops/jamb/source-pool.json'), 'utf8')).questions;
  const covered = new Map();
  for (const filename of batches) {
    const batch = JSON.parse(fs.readFileSync(path.join(evidenceDir, filename), 'utf8'));
    const script = 'check-' + filename.replace('-publishable-', '-').replace('.json', '.cjs');
    assert.ok(fs.existsSync(path.join(evidenceDir, script)), 'Missing review evidence check for ' + filename);
    const result = JSON.parse(execFileSync(process.execPath, [path.join(evidenceDir, script)], {
      cwd: root, encoding: 'utf8', timeout: 30000, maxBuffer: 1024 * 1024
    }));
    assert.equal(result.passed, true, filename);
    assert.deepEqual([...result.question_ids].sort(), batch.records.map(r => r.id).sort());
    assert.equal(new Set(result.question_ids).size, batch.records.length);
    for (const record of batch.records) {
      const review = ledger.questions[record.id];
      assert.ok(review, 'Batch record has no review: ' + record.id);
      assert.equal(record.content_sha256, review.content_sha256, record.id);
      if (record.publication_candidate === true) {
        const result = assessQuestion(pool.find(q => q.id === record.id), ledger);
        assert.equal(result.state, 'eligible', record.id + ': approved evidence cannot silently remain quarantined: ' + result.reasons.join(', '));
      }
      assert.ok(review.answer_review.evidence.includes(filename + '#' + record.id));
      assert.ok(review.answer_review.evidence.includes(script));
      covered.set(record.id, record.content_sha256);
    }
  }
  for (const number of ['02','03']) {
    const batchName = `jamb-math-2023-reviewed-batch-${number}.json`;
    const snapshotName = `jamb-math-2023-source-snapshot-${number}.json`;
    const batch = JSON.parse(fs.readFileSync(path.join(root, 'ops/nigeria-exams', batchName), 'utf8'));
    const raw = fs.readFileSync(path.join(root, 'ops/nigeria-exams', snapshotName));
    const snapshot = JSON.parse(raw);
    const snapshotHash = crypto.createHash('sha256').update(raw).digest('hex');
    assert.equal(snapshot.records.length, batch.items.length, batchName);
    for (const item of batch.items) {
      const id = `mathematics-2023-myschool-${item.sourceItem}`;
      const question = pool.find(q => q.id === id);
      const review = ledger.questions[id];
      assert.ok(question && review, 'Missing reviewed Mathematics item ' + id);
      assert.equal(review.content_sha256, require('../scripts/lib/jamb-content-trust').questionFingerprint(question), id);
      assert.equal(ledger.sources[review.source_id]?.content_sha256, snapshotHash, id);
      assert.equal(snapshot.records.find(r => r.source_item === item.sourceItem)?.adapted_prompt, item.question, id);
      assert.equal(assessQuestion(question, ledger).state, 'eligible', id);
      for (const evidence of [batchName, snapshotName, 'tests/jamb-math-2023-batches.test.js'])
        assert.ok(review.answer_review.evidence.includes(evidence), id + ': missing ' + evidence);
      covered.set(id, review.content_sha256);
    }
  }
  const aiReviews = Object.entries(ledger.questions).filter(([,review]) => review.answer_review?.reviewer_type === 'ai');
  assert.ok(aiReviews.length > 0, 'No actual answer reviews were exercised');
  for (const [id,review] of aiReviews) assert.equal(covered.get(id), review.content_sha256, 'AI review lacks executable evidence: ' + id);
});
