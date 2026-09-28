'use strict';

// Owner-directed adapted practice. Webpage positions are not exam numbering.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');
const { solveAnswers, ACCEPTED, DUPLICATES } = require('../jamb/verification/check-mathematics-2021-001.cjs');

const root = path.resolve(__dirname, '../..');
const manifestPath = 'ops/nigeria-exams/jamb-math-2021-curated-batch-01.json';
const snapshotPath = 'ops/nigeria-exams/jamb-math-2021-source-snapshot-01.json';
const receiptPath = 'ops/jamb/verification/mathematics-2021-publishable-001.json';
const checkerPath = 'ops/jamb/verification/check-mathematics-2021-001.cjs';
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = value => value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function sourceUrl(sourceItem) {
  return `https://myschool.ng/classroom/mathematics/${sourceItem}?exam_type=jamb&exam_year=2021&page=${sourceItem === '60716' ? 7 : 8}`;
}

function validateManifest(manifest) {
  if (manifest.schema_version !== 1 || manifest.observed_at !== '2026-09-28'
      || manifest.publisher !== 'Myschool' || manifest.collection_year !== 2021
      || manifest.year_basis !== 'publisher-collection' || manifest.sitting_authenticated !== false
      || !Array.isArray(manifest.items) || manifest.items.length !== 5
      || !Array.isArray(manifest.held) || manifest.held.length !== 4
      || JSON.stringify(manifest.items.map(item => item.sourceItem)) !== JSON.stringify(ACCEPTED)
      || JSON.stringify(manifest.held.map(item => item.sourceItem)) !== JSON.stringify(DUPLICATES)) {
    throw Error('Unexpected Mathematics 2021 provenance, accepted items or duplicate decisions');
  }
  const positions = [...manifest.items, ...manifest.held].map(item => item.position).sort((a, b) => a - b);
  if (JSON.stringify(positions) !== JSON.stringify([31, 33, 34, 35, 36, 37, 38, 39, 40])) {
    throw Error('Screened collection positions must have one disposition');
  }
  const answers = solveAnswers(manifest);
  for (const item of manifest.items) {
    if (typeof item.question !== 'string' || item.question.length < 20
        || !item.options || Object.keys(item.options).sort().join('') !== 'ABCD'
        || Object.values(item.options).some(option => typeof option !== 'string' || !option.trim())
        || new Set(Object.values(item.options)).size !== 4
        || !item.observed_options || Object.keys(item.observed_options).sort().join('') !== 'ABCD'
        || Object.values(item.observed_options).some(option => typeof option !== 'string' || !option.trim())
        || new Set(Object.values(item.observed_options)).size !== 4
        || item.answer !== answers[item.sourceItem] || item.publisher_answer !== answers[item.sourceItem]
        || typeof item.explanation !== 'string' || item.explanation.length < 65
        || !/^[a-f0-9]{64}$/.test(item.source_prompt_sha256 || '')
        || typeof item.source_observed_at !== 'string' || !item.source_observed_at.startsWith(manifest.observed_at + 'T')
        || !Number.isFinite(Date.parse(item.source_observed_at))
        || item.source_url !== sourceUrl(item.sourceItem)
        || (Object.hasOwn(item, 'num') && item.num !== null)) {
      throw Error('Incomplete source, invented exam number or independently selected answer mismatch: ' + item.sourceItem);
    }
  }
}

function prepareBatch(manifest, pool, ledger) {
  validateManifest(manifest);
  const nextPool = structuredClone(pool), nextLedger = structuredClone(ledger);
  const snapshot = {
    schema_version: 1, observed_at: manifest.observed_at, publisher: manifest.publisher,
    collection_year: 2021, year_basis: 'publisher-collection', sitting_authenticated: false,
    description: 'Individually inspected linked source pages, adapted mathematical briefs, observed options and comparison keys. No authenticated sitting, official key, paper order or third-party licence is asserted.',
    records: manifest.items.map(item => ({
      collection_position: item.position, source_item: item.sourceItem, source_url: item.source_url,
      source_observed_at: item.source_observed_at, source_prompt_sha256: item.source_prompt_sha256,
      adapted_prompt: item.question, options: item.options, observed_options: item.observed_options,
      publisher_answer: item.publisher_answer
    }))
  };
  const snapshotText = serialize(snapshot), snapshotHash = sha(snapshotText);
  const receipt = {
    schema_version: 1, reviewed_at: manifest.observed_at, reviewer: 'Codex (AI)',
    source_file: snapshotPath, source_snapshot_sha256: snapshotHash,
    authority_note: 'Owner-directed public source use; adapted questions and independent calculations. Collection year only; no official sitting, exam-board licence or teacher approval asserted.',
    records: []
  };
  for (const item of manifest.items) {
    const id = 'mathematics-2021-myschool-' + item.sourceItem;
    const sourceId = 'owner-directed-myschool-mathematics-2021-' + item.sourceItem;
    const question = {
      id, subject: 'mathematics', year: 2021, num: null,
      question: item.question, options: item.options, answer: item.answer,
      format: 4, has_diagram: false, topic: item.topic, explanation: item.explanation,
      verification: { method: 'ai-calculation-checked', reviewed_at: manifest.observed_at },
      source_provenance: { publisher: 'Myschool', url: item.source_url, year_basis: 'publisher-collection' }
    };
    const current = nextPool.questions.find(row => row.id === id);
    if (current && questionFingerprint(current) !== questionFingerprint(question)) {
      throw Error('Existing intake content changed; re-review before reimport: ' + id);
    }
    if (!current && nextPool.questions.some(row => normalize(row.question) === normalize(question.question))) {
      throw Error('Duplicate adapted prompt: ' + id);
    }
    if (item.sourceItem === '60732') {
      const held = nextPool.questions.find(row => row.id === 'mathematics-1985-4-09798bb21718');
      if (!held || assessQuestion(held, nextLedger).state === 'eligible') {
        throw Error('The separately reviewed 60732 variant requires the older raw problem to remain held');
      }
    }
    nextLedger.sources[sourceId] = {
      source_file: snapshotPath, content_sha256: snapshotHash, source_url: item.source_url,
      publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: 2021,
      sitting_authenticated: false, official_answer_key: false,
      label: `Myschool publisher-labelled 2021 Mathematics collection item ${item.sourceItem}; sitting unconfirmed`,
      reuse_authorization: {
        status: 'authorized-by-owner', basis: 'owner-directed-public-source',
        scope: 'AfroTools past-question practice', material_sha256: snapshotHash,
        authorized_by: 'AfroTools owner', authorized_at: manifest.observed_at,
        instruction_ref: 'Owner instruction to use existing past questions, independently verify every answer and continue education content expansion. This records owner direction, not publisher or exam-board permission.'
      }
    };
    const evidence = `${manifestPath}#${item.sourceItem}; ${snapshotPath}#${item.sourceItem}; ${path.basename(receiptPath)}#${id}; ${path.basename(checkerPath)}; tests/jamb-math-2021-batch-01.test.js`;
    const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: manifest.observed_at, evidence };
    const fingerprint = questionFingerprint(question);
    nextLedger.questions[id] = { source_id: sourceId, content_sha256: fingerprint,
      question_review: { ...review }, answer_review: { ...review, reviewer_type: 'ai' }, explanation_review: { ...review } };
    const result = assessQuestion(question, nextLedger);
    if (result.state !== 'eligible') throw Error('Intake rejected: ' + id + ': ' + result.reasons.join(', '));
    if (!current) nextPool.questions.push(question);
    receipt.records.push({ id, source_item: item.sourceItem, collection_position: item.position,
      content_sha256: fingerprint, answer: item.answer, publisher_answer: item.publisher_answer,
      independently_selected_answer: item.answer, publication_candidate: true });
  }
  nextPool.count = nextPool.questions.length;
  nextPool.answered_count = nextPool.questions.filter(question => question.answer).length;
  return { pool: nextPool, ledger: nextLedger, snapshot, snapshotText, receipt };
}

if (require.main === module) {
  const manifest = read(manifestPath);
  const prepared = prepareBatch(manifest, read('ops/jamb/source-pool.json'), read('data/jamb/review-ledger.json'));
  for (const [file, bytes] of [
    [snapshotPath, prepared.snapshotText], [receiptPath, serialize(prepared.receipt)],
    ['ops/jamb/source-pool.json', JSON.stringify(prepared.pool) + '\n'],
    ['data/jamb/review-ledger.json', serialize(prepared.ledger)]
  ]) fs.writeFileSync(path.join(root, file), bytes);
  process.stdout.write(JSON.stringify({ accepted: prepared.receipt.records.length,
    excluded_public_duplicates: manifest.held.length,
    files: [snapshotPath, receiptPath, 'ops/jamb/source-pool.json', 'data/jamb/review-ledger.json'] }) + '\n');
}
module.exports = { validateManifest, prepareBatch };
