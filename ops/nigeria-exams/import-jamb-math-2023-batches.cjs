'use strict';

// Import adapted mathematical briefs from individually inspected public pages.
// The publisher's collection year is not an authenticated UTME sitting.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const write = (file, value) => fs.writeFileSync(path.join(root, file), JSON.stringify(value, null, 2) + '\n');
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const batchFiles = ['jamb-math-2023-reviewed-batch-02.json', 'jamb-math-2023-reviewed-batch-03.json'];
const seen = new Set();
for (const batchFile of batchFiles) {
  const file = 'ops/nigeria-exams/' + batchFile;
  const batch = read(file);
  if (batch.schema_version !== 1 || batch.publisher !== 'Myschool' || batch.collection_year !== 2023
      || batch.year_basis !== 'publisher-collection' || batch.sitting_authenticated !== false) throw Error('Unexpected batch provenance: ' + file);
  const records = batch.items.map(item => ({
    source_url: `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2023`,
    publisher: batch.publisher, collection_year: batch.collection_year, source_item: item.sourceItem,
    adapted_prompt: item.question, options: item.options
  }));
  const snapshotPath = `ops/nigeria-exams/jamb-math-2023-source-snapshot-${batchFile.match(/batch-(\d+)/)[1]}.json`;
  const snapshot = { schema_version: 1, observed_at: batch.observed_at,
    description: 'Individually inspected public source pages, with adapted mathematical briefs and normalized choices; no official sitting or question numbers asserted.', records };
  const snapshotText = JSON.stringify(snapshot, null, 2) + '\n';
  const snapshotHash = sha(snapshotText);
  const reviewed = [];
  for (const item of batch.items) {
    if (!/^\d{5}$/.test(item.sourceItem) || seen.has(item.sourceItem)) throw Error('Duplicate or invalid source item: ' + item.sourceItem);
    seen.add(item.sourceItem);
    const id = 'mathematics-2023-myschool-' + item.sourceItem;
    const sourceId = 'owner-directed-myschool-' + item.sourceItem;
    const url = `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2023`;
    const question = { id, subject: 'mathematics', year: 2023, num: null,
      question: item.question, options: item.options, answer: item.answer, format: 4, has_diagram: false,
      topic: item.topic, explanation: item.explanation,
      verification: { method: 'ai-calculation-checked', reviewed_at: batch.observed_at },
      source_provenance: { publisher: 'Myschool', url, year_basis: 'publisher-collection' } };
    ledger.sources[sourceId] = { source_file: snapshotPath, content_sha256: snapshotHash,
      source_url: url, publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: 2023,
      official_answer_key: false,
      reuse_authorization: { status: 'authorized-by-owner', basis: 'owner-directed-public-source',
        scope: 'AfroTools past-question practice', material_sha256: snapshotHash, authorized_by: 'AfroTools owner',
        authorized_at: batch.observed_at,
        instruction_ref: 'Owner instruction to build sourced recent JAMB practice from existing past-question collections; adapted briefs and independent solutions, not a publisher or exam-board licence.' } };
    const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: batch.observed_at,
      evidence: `${snapshotPath}#${item.sourceItem}; ${file}#${item.sourceItem}; tests/jamb-math-2023-batches.test.js` };
    ledger.questions[id] = { source_id: sourceId, content_sha256: questionFingerprint(question),
      question_review: { ...review }, answer_review: { ...review, reviewer_type: 'ai' }, explanation_review: { ...review } };
    const outcome = assessQuestion(question, ledger);
    if (outcome.state !== 'eligible') throw Error('Intake rejected: ' + id + ': ' + outcome.reasons.join(','));
    const existingIndex = pool.questions.findIndex(q => q.id === id);
    if (existingIndex !== -1) {
      const existing = pool.questions[existingIndex];
      if (existing.source_provenance?.url !== url || existing.source_provenance?.year_basis !== 'publisher-collection')
        throw Error('Existing question has different provenance: ' + id);
      pool.questions[existingIndex] = question;
    } else pool.questions.push(question);
    reviewed.push({ id, source_item: item.sourceItem, content_sha256: questionFingerprint(question),
      answer: question.answer, publication_candidate: true });
  }
  fs.writeFileSync(path.join(root, snapshotPath), snapshotText);
  write(`ops/jamb/verification/math-2023-publishable-${batchFile.match(/batch-(\d+)/)[1]}.json`, {
    schema_version: 1, reviewed_at: batch.observed_at, reviewer: 'Codex (AI)',
    source_file: snapshotPath, source_snapshot_sha256: snapshotHash,
    authority_note: 'Owner-directed public source use; publisher collection year only. Adapted briefs and original checked solutions. No official sitting, exam-board licence or teacher approval asserted.',
    records: reviewed
  });
  console.log(JSON.stringify({ batch: batchFile, accepted: reviewed.length }));
}
pool.count = pool.questions.length;
pool.answered_count = pool.questions.filter(q => q.answer).length;
fs.writeFileSync(path.join(root, 'ops/jamb/source-pool.json'), JSON.stringify(pool) + '\n');
write('data/jamb/review-ledger.json', ledger);
