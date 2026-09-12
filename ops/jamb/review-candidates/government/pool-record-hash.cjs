'use strict';
const priorRecordHash = require('../economics/prior-record-hash.cjs');
module.exports = function poolRecordHash(record, {integrated, mixedPrior, currentIds, ledger}) {
  if (mixedPrior && !currentIds.has(record.id)) return priorRecordHash(record, integrated, ledger);
  return integrated && record.publication_candidate ? record.content_sha256 : record.original_content_sha256;
};
