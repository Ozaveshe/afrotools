'use strict';
const priorRecordHash = require('../economics/prior-record-hash.cjs');
const acceptedRecoveryHash = require('./accepted-recovery-hash.cjs');
module.exports = function poolRecordHash(record, {integrated, mixedPrior, currentIds, ledger, current}) {
  if (integrated || mixedPrior) {
    const recovered = acceptedRecoveryHash(record, current, ledger);
    if (recovered) return recovered;
  }
  if (mixedPrior && !currentIds.has(record.id)) return priorRecordHash(record, integrated, ledger);
  return integrated && record.publication_candidate ? record.content_sha256 : record.original_content_sha256;
};
