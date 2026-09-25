'use strict';

// Import adapted, independently solved items from a publisher-labelled collection.
// Collection positions are not authenticated UTME question numbers.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../..');
const manifestPath = 'ops/nigeria-exams/jamb-math-2025-curated-recovery-04.json';
const snapshotPath = 'ops/nigeria-exams/jamb-math-2025-source-snapshot-04.json';
const receiptPath = 'ops/jamb/verification/mathematics-2025-publishable-004.json';
const checkerPath = 'ops/jamb/verification/check-mathematics-2025-004.cjs';
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = text => text.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();

function validateManifest(manifest) {
  if (manifest.schema_version !== 1 || manifest.observed_at !== '2026-09-25'
      || manifest.publisher !== 'Myschool' || manifest.collection_year !== 2025
      || manifest.year_basis !== 'publisher-collection' || manifest.sitting_authenticated !== false
      || !Array.isArray(manifest.items) || manifest.items.length !== 9
      || !Array.isArray(manifest.reinspected_holds) || manifest.reinspected_holds.length !== 2
      || manifest.unavailable_requested_positions?.from !== 56
      || manifest.unavailable_requested_positions?.to !== 75
      || manifest.unavailable_requested_positions?.status !== 'not-present-in-filtered-publisher-collection'
      || JSON.stringify(manifest.unavailable_requested_positions.checked_empty_pages) !== '[12,13,14,15]') {
    throw Error('Unexpected Mathematics 2025 recovery-04 provenance or size');
  }
  const positions = manifest.items.map(item => item.position);
  if (JSON.stringify(positions) !== '[1,3,42,44,49,50,51,53,55]') {
    throw Error('Recovery positions must match individually inspected held items');
  }
  const sourceItems = [...manifest.items, ...manifest.reinspected_holds].map(item => item.sourceItem);
  if (new Set(sourceItems).size !== sourceItems.length || sourceItems.some(id => !/^\d{5}$/.test(id))) {
    throw Error('Duplicate or invalid source item');
  }
  for (const item of manifest.items) {
    if (typeof item.question !== 'string' || item.question.length < 20
        || !item.options || Object.keys(item.options).sort().join('') !== 'ABCD'
        || new Set(Object.values(item.options)).size !== 4
        || !'ABCD'.includes(item.answer) || item.answer.length !== 1
        || typeof item.explanation !== 'string' || item.explanation.length < 65
        || (item.source_figure && (!/^https:\/\/myschool\.ng\/storage\/classroom\//.test(item.source_figure.url)
          || !/^[a-f0-9]{64}$/.test(item.source_figure.sha256)
          || item.source_figure.transcription.length < 30))) {
      throw Error('Incomplete reviewed item at collection position ' + item.position);
    }
  }
}

function prepareBatch(manifest, pool, ledger) {
  validateManifest(manifest);
  const nextPool = structuredClone(pool);
  const nextLedger = structuredClone(ledger);
  const existingStems = new Set(nextPool.questions.map(question => normalize(question.question)));
  const snapshot = {
    schema_version: 1,
    observed_at: manifest.observed_at,
    publisher: manifest.publisher,
    collection_year: 2025,
    year_basis: 'publisher-collection',
    sitting_authenticated: false,
    description: 'Individually inspected source pages and figures with adapted mathematical briefs. Requested collection positions 56–75 were absent. No authenticated sitting, official key, paper order or exam-board licence is asserted.',
    records: manifest.items.map(item => ({
      collection_position: item.position,
      source_item: item.sourceItem,
      source_url: `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2025`,
      adapted_prompt: item.question,
      options: item.options,
      source_figure: item.source_figure || null,
      source_repair: item.source_repair || null
    }))
  };
  const snapshotText = serialize(snapshot);
  const snapshotHash = sha(snapshotText);
  const receipt = {
    schema_version: 1,
    reviewed_at: manifest.observed_at,
    reviewer: 'Codex (AI)',
    source_file: snapshotPath,
    source_snapshot_sha256: snapshotHash,
    authority_note: 'Owner-directed public source use; adapted questions and independent calculations. Source figures transcribed in text; source defects corrected only in adapted practice. Collection year only; no official sitting, exam-board licence or teacher approval asserted.',
    records: []
  };

  for (const item of manifest.items) {
    const id = `mathematics-2025-myschool-${item.sourceItem}`;
    const sourceId = `owner-directed-myschool-${item.sourceItem}`;
    const url = `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=2025`;
    const question = {
      id, subject: 'mathematics', year: 2025, num: null,
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
      publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: 2025,
      official_answer_key: false,
      label: `Myschool publisher-labelled 2025 Mathematics revision item ${item.position}; sitting unconfirmed`,
      reuse_authorization: {
        status: 'authorized-by-owner', basis: 'owner-directed-public-source',
        scope: 'AfroTools past-question practice', material_sha256: snapshotHash,
        authorized_by: 'AfroTools owner', authorized_at: manifest.observed_at,
        instruction_ref: 'Owner direction to continue recent JAMB source review with adapted practice and independent answers. This does not claim publisher or exam-board permission.'
      }
    };
    const evidence = `${snapshotPath}#${item.sourceItem}; ${manifestPath}#${item.sourceItem}; ${path.basename(receiptPath)}#${id}; ${path.basename(checkerPath)}; tests/jamb-math-2025-recovery-04.test.js`;
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
  for (const [name, content] of [
    [snapshotPath, prepared.snapshotText],
    [receiptPath, serialize(prepared.receipt)],
    ['ops/jamb/source-pool.json', JSON.stringify(prepared.pool) + '\n'],
    ['data/jamb/review-ledger.json', serialize(prepared.ledger)]
  ]) fs.writeFileSync(path.join(root, name), content);
  process.stdout.write(JSON.stringify({ accepted: prepared.receipt.records.length,
    held: read(manifestPath).reinspected_holds.length, unavailable: 20,
    files: [snapshotPath, receiptPath, 'ops/jamb/source-pool.json', 'data/jamb/review-ledger.json'] }) + '\n');
}

module.exports = { validateManifest, prepareBatch };
