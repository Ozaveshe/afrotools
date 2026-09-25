'use strict';

// Publisher-labelled revision material, not an authenticated UTME paper.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../..');
const manifestPath = 'ops/nigeria-exams/jamb-math-2022-curated-batch-01.json';
const snapshotPath = 'ops/nigeria-exams/jamb-math-2022-source-snapshot-01.json';
const receiptPath = 'ops/jamb/verification/mathematics-2022-publishable-001.json';
const checkerPath = 'ops/jamb/verification/check-mathematics-2022-001.cjs';
const read = file => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function validateManifest(manifest) {
  if (manifest.schema_version !== 1 || manifest.observed_at !== '2026-09-26' ||
      manifest.publisher !== 'Myschool' || manifest.collection_year !== 2022 ||
      manifest.year_basis !== 'publisher-collection' || manifest.sitting_authenticated !== false ||
      !Array.isArray(manifest.items) || manifest.items.length !== 16) {
    throw Error('Unexpected Mathematics 2022 batch provenance or size');
  }
  const positions = manifest.items.map(item => item.position);
  const sourceItems = manifest.items.map(item => item.sourceItem);
  if (new Set(positions).size !== 16 || new Set(sourceItems).size !== 16 ||
      positions.some(position => !Number.isInteger(position) || position < 1 || position > 40) ||
      sourceItems.some(id => !/^\d{5}$/.test(id))) throw Error('Duplicate or invalid source position');
  for (const item of manifest.items) {
    if (typeof item.question !== 'string' || item.question.length < 20 ||
        !item.options || Object.keys(item.options).sort().join('') !== 'ABCD' ||
        new Set(Object.values(item.options)).size !== 4 ||
        !'ABCD'.includes(item.answer) || item.answer.length !== 1 ||
        typeof item.topic !== 'string' ||
        typeof item.explanation !== 'string' || item.explanation.length < 65) {
      throw Error('Incomplete reviewed item at collection position ' + item.position);
    }
  }
}

function prepareBatch(manifest, pool, ledger) {
  validateManifest(manifest);
  const nextPool = structuredClone(pool);
  const nextLedger = structuredClone(ledger);
  const existingStems = new Set(nextPool.questions.map(q => normalize(q.question)));
  const snapshot = {
    schema_version: 1, observed_at: manifest.observed_at, publisher: manifest.publisher,
    collection_year: 2022, year_basis: 'publisher-collection', sitting_authenticated: false,
    description: 'Inspected publisher collection entries and available item pages; adapted briefs and independently recomputed answers. No original sitting, official key, paper order or publisher licence is asserted.',
    records: manifest.items.map(item => ({
      collection_position: item.position, source_item: item.sourceItem,
      source_url: `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2022`,
      adapted_prompt: item.question, options: item.options
    }))
  };
  const snapshotText = serialize(snapshot);
  const snapshotHash = sha(snapshotText);
  const receipt = {
    schema_version: 1, reviewed_at: manifest.observed_at, reviewer: 'Codex (AI)',
    source_file: snapshotPath, source_snapshot_sha256: snapshotHash,
    authority_note: 'Owner-directed public-source use with original adapted wording and independent calculations. Collection year only; no official sitting, publisher licence or teacher approval asserted.',
    records: []
  };
  for (const item of manifest.items) {
    const id = `mathematics-2022-myschool-${item.sourceItem}`;
    const sourceId = `owner-directed-myschool-${item.sourceItem}`;
    const url = `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2022`;
    const question = {
      id, subject: 'mathematics', year: 2022, num: null,
      question: item.question, options: item.options, answer: item.answer,
      format: 4, has_diagram: false, topic: item.topic, explanation: item.explanation,
      verification: { method: 'ai-calculation-checked', reviewed_at: manifest.observed_at },
      source_provenance: { publisher: 'Myschool', url, year_basis: 'publisher-collection' }
    };
    const current = nextPool.questions.find(q => q.id === id);
    if (current && (current.source_provenance?.url !== url || current.num !== null)) {
      throw Error('Existing item has different provenance: ' + id);
    }
    if (!current && existingStems.has(normalize(question.question))) {
      throw Error('Duplicate adapted prompt: ' + id);
    }
    nextLedger.sources[sourceId] = {
      source_file: snapshotPath, content_sha256: snapshotHash, source_url: url,
      publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: 2022,
      official_answer_key: false,
      label: `Myschool publisher-labelled 2022 Mathematics revision item ${item.position}; sitting unconfirmed`,
      reuse_authorization: {
        status: 'authorized-by-owner', basis: 'owner-directed-public-source',
        scope: 'AfroTools past-question practice', material_sha256: snapshotHash,
        authorized_by: 'AfroTools owner', authorized_at: manifest.observed_at,
        instruction_ref: 'Owner direction to continue recent JAMB source review with adapted practice and independent answers. This does not claim publisher or exam-board permission.'
      }
    };
    const evidence = `${snapshotPath}#${item.sourceItem}; ${manifestPath}#${item.sourceItem}; ${path.basename(receiptPath)}#${id}; ${path.basename(checkerPath)}; tests/jamb-math-2022-batch-01.test.js`;
    const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: manifest.observed_at, evidence };
    const fingerprint = questionFingerprint(question);
    nextLedger.questions[id] = {
      source_id: sourceId, content_sha256: fingerprint,
      question_review: { ...review },
      answer_review: { ...review, reviewer_type: 'ai' },
      explanation_review: { ...review }
    };
    const result = assessQuestion(question, nextLedger);
    if (result.state !== 'eligible') throw Error('Intake rejected: ' + id + ': ' + result.reasons.join(', '));
    if (current) Object.assign(current, question);
    else nextPool.questions.push(question);
    existingStems.add(normalize(question.question));
    receipt.records.push({ id, source_item: item.sourceItem, collection_position: item.position,
      content_sha256: fingerprint, answer: item.answer, publication_candidate: true });
  }
  nextPool.count = nextPool.questions.length;
  nextPool.answered_count = nextPool.questions.filter(q => q.answer).length;
  return { pool: nextPool, ledger: nextLedger, snapshot, snapshotText, receipt };
}

if (require.main === module) {
  const prepared = prepareBatch(read(manifestPath), read('ops/jamb/source-pool.json'), read('data/jamb/review-ledger.json'));
  for (const [file, content] of [
    [snapshotPath, prepared.snapshotText],
    [receiptPath, serialize(prepared.receipt)],
    ['ops/jamb/source-pool.json', JSON.stringify(prepared.pool) + '\n'],
    ['data/jamb/review-ledger.json', serialize(prepared.ledger)]
  ]) fs.writeFileSync(path.join(root, file), content);
  process.stdout.write(JSON.stringify({ accepted: prepared.receipt.records.length,
    files: [snapshotPath, receiptPath, 'ops/jamb/source-pool.json', 'data/jamb/review-ledger.json'] }) + '\n');
}

module.exports = { validateManifest, prepareBatch };
