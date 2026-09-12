'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const expectedHash = require('../ops/jamb/review-candidates/economics/prior-record-hash.cjs');
test('mixed prior batches require exact accepted ledger evidence and preserve held hashes', () => {
  const row = {id: 'prior', publication_candidate: true, original_content_sha256: 'original', content_sha256: 'candidate'};
  const entry = {content_sha256: 'candidate', ...Object.fromEntries(['question_review','answer_review','explanation_review'].map(k => [k,{status:'accepted'}]))};
  assert.equal(expectedHash(row, false, {questions:{prior:entry}}), 'candidate');
  assert.equal(expectedHash(row, false, {questions:{}}), 'original');
  assert.equal(expectedHash(row, false, null), 'original');
  assert.equal(expectedHash(row, true, null), 'candidate');
  assert.throws(() => expectedHash(row, false, {questions:{prior:{...entry,content_sha256:'changed'}}}), /fingerprint drift/);
  for (const field of ['question_review','answer_review','explanation_review']) {
    assert.throws(() => expectedHash(row, false, {questions:{prior:{...entry,[field]:{status:'pending'}}}}), /incomplete/);
  }
  const held = {...row, publication_candidate:false};
  assert.equal(expectedHash(held, true, {questions:{}}), 'original');
  assert.throws(() => expectedHash(held, false, {questions:{prior:entry}}), /Held prior/);
});
