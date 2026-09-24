'use strict';

// Import independently solved, adapted briefs from individually inspected
// publisher-labelled collections. A collection year is not a verified UTME sitting.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../..');
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const batches = [2024, 2025].map(year => ({ year, file: `ops/nigeria-exams/jamb-math-${year}-reviewed-batch-01.json` }));
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const outputs = new Map();
const seen = new Set();

for (const { year, file } of batches) {
  const batch = read(file);
  if (batch.schema_version !== 1 || batch.publisher !== 'Myschool' || batch.collection_year !== year
      || batch.year_basis !== 'publisher-collection' || batch.sitting_authenticated !== false
      || batch.observed_at !== '2026-09-24') throw Error('Unexpected batch provenance: ' + file);
  if (batch.items.length !== (year === 2024 ? 20 : 15)) throw Error('Unexpected reviewed item count: ' + file);
  const snapshotPath = `ops/nigeria-exams/jamb-math-${year}-source-snapshot-01.json`;
  const snapshot = {
    schema_version: 1,
    observed_at: batch.observed_at,
    publisher: batch.publisher,
    collection_year: year,
    year_basis: 'publisher-collection',
    sitting_authenticated: false,
    description: 'Individually inspected public source pages; adapted mathematical briefs and normalized choices. This is not an authenticated exam paper or question order.',
    records: batch.items.map(item => ({
      source_url: `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=${year}`,
      source_item: item.sourceItem,
      adapted_prompt: item.question,
      options: item.options
    }))
  };
  const snapshotText = serialize(snapshot);
  const snapshotHash = sha(snapshotText);
  const reviewed = [];

  for (const item of batch.items) {
    if (!/^\d{5}$/.test(item.sourceItem) || seen.has(item.sourceItem)) throw Error('Duplicate or invalid source item: ' + item.sourceItem);
    seen.add(item.sourceItem);
    const id = `mathematics-${year}-myschool-${item.sourceItem}`;
    const sourceId = `owner-directed-myschool-${item.sourceItem}`;
    const url = `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=${year}`;
    const question = {
      id, subject: 'mathematics', year, num: null,
      question: item.question, options: item.options, answer: item.answer, format: 4, has_diagram: false,
      topic: item.topic, explanation: item.explanation,
      verification: { method: 'ai-calculation-checked', reviewed_at: batch.observed_at },
      source_provenance: { publisher: 'Myschool', url, year_basis: 'publisher-collection' }
    };
    ledger.sources[sourceId] = {
      source_file: snapshotPath, content_sha256: snapshotHash, source_url: url,
      publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: year,
      official_answer_key: false,
      reuse_authorization: {
        status: 'authorized-by-owner', basis: 'owner-directed-public-source',
        scope: 'AfroTools past-question practice', material_sha256: snapshotHash,
        authorized_by: 'AfroTools owner', authorized_at: batch.observed_at,
        instruction_ref: 'Owner-directed sourced JAMB practice; adapted briefs and independent solutions. This does not claim a publisher or exam-board licence.'
      }
    };
    const review = {
      status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: batch.observed_at,
      evidence: `${snapshotPath}#${item.sourceItem}; ${file}#${item.sourceItem}; tests/jamb-math-2024-2025-batches.test.js`
    };
    ledger.questions[id] = {
      source_id: sourceId, content_sha256: questionFingerprint(question),
      question_review: { ...review }, answer_review: { ...review, reviewer_type: 'ai' }, explanation_review: { ...review }
    };
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
  outputs.set(snapshotPath, snapshotText);
  outputs.set(`ops/jamb/verification/math-${year}-publishable-01.json`, serialize({
    schema_version: 1, reviewed_at: batch.observed_at, reviewer: 'Codex (AI)',
    source_file: snapshotPath, source_snapshot_sha256: snapshotHash,
    authority_note: 'Owner-directed public source use; publisher collection year only. Adapted briefs and original checked solutions. No official sitting, exam-board licence or teacher approval asserted.',
    records: reviewed
  }));
}

pool.count = pool.questions.length;
pool.answered_count = pool.questions.filter(q => q.answer).length;
outputs.set('ops/jamb/source-pool.json', JSON.stringify(pool) + '\n');
outputs.set('data/jamb/review-ledger.json', serialize(ledger));
for (const [file, content] of outputs) fs.writeFileSync(path.join(root, file), content);
console.log(JSON.stringify({ accepted: seen.size, by_year: { 2024: 20, 2025: 15 }, files: [...outputs.keys()] }));
