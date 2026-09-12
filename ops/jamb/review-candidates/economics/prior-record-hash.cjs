'use strict';
const assert = require('node:assert/strict');
module.exports = function priorRecordHash(record, integrated, ledger) {
  if (ledger && Object.prototype.hasOwnProperty.call(ledger.questions, record.id)) {
    const entry = ledger.questions[record.id];
    assert.ok(record.publication_candidate, 'Held prior record has a ledger entry');
    assert.equal(entry.content_sha256, record.content_sha256, 'Prior ledger fingerprint drift');
    for (const field of ['question_review', 'answer_review', 'explanation_review']) {
      assert.equal(entry[field]?.status, 'accepted', 'Prior ledger review is incomplete');
    }
    return record.content_sha256;
  }
  return integrated && record.publication_candidate ? record.content_sha256 : record.original_content_sha256;
};
