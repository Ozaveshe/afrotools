'use strict';

// Import adapted, independently solved source items recovered from the 2023 holds.
// This is a publisher collection label, not a certified UTME sitting.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../..');
const manifestPath = 'ops/nigeria-exams/jamb-math-2023-held-recovery-04.json';
const originalHoldPath = 'ops/nigeria-exams/jamb-math-2023-held-20260924.json';
const snapshotPath = 'ops/nigeria-exams/jamb-math-2023-source-snapshot-04.json';
const receiptPath = 'ops/jamb/verification/mathematics-2023-publishable-004.json';
const checkerPath = 'ops/jamb/verification/check-mathematics-2023-004.cjs';
const poolPath = 'ops/jamb/source-pool.json';
const ledgerPath = 'data/jamb/review-ledger.json';
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const sourceUrl = item => `https://myschool.ng/classroom/mathematics/${item}?exam_type=jamb&exam_year=2023`;

function validateManifest(manifest, originalHolds) {
  if (manifest.schema_version !== 1 || manifest.observed_at !== '2026-09-26'
      || manifest.publisher !== 'Myschool' || manifest.collection_year !== 2023
      || manifest.year_basis !== 'publisher-collection' || manifest.sitting_authenticated !== false
      || !Array.isArray(manifest.items) || manifest.items.length !== 9
      || !Array.isArray(manifest.remaining_held) || manifest.remaining_held.length !== 11) {
    throw Error('Unexpected Mathematics 2023 recovery provenance or size');
  }
  const expectedAccepted = ['67254','67259','67279','67284','67298','67348','67359','67370','67379'];
  const accepted = manifest.items.map(item => item.sourceItem);
  if (JSON.stringify(accepted) !== JSON.stringify(expectedAccepted)) throw Error('Unexpected recovery item or order');
  const all = [...accepted, ...manifest.remaining_held.map(item => item.sourceItem)];
  if (new Set(all).size !== 20 || all.some(id => !/^\d{5}$/.test(id))) {
    throw Error('Duplicate or invalid source item');
  }
  const original = originalHolds.held.map(item => item.sourceItem);
  if (originalHolds.year_basis !== 'publisher-collection'
      || JSON.stringify([...all].sort()) !== JSON.stringify([...original].sort())) {
    throw Error('Recovery does not reconcile the original 20-item hold ledger');
  }
  const figureItems = new Set(['67259','67298','67348','67359','67379']);
  for (const item of manifest.items) {
    if (typeof item.question !== 'string' || item.question.length < 70
        || typeof item.topic !== 'string' || item.topic.length < 5
        || typeof item.source_observation !== 'string' || item.source_observation.length < 75
        || !item.options || Object.keys(item.options).sort().join('') !== 'ABCD'
        || new Set(Object.values(item.options)).size !== 4
        || !'ABCD'.includes(item.answer) || item.answer.length !== 1
        || typeof item.explanation !== 'string' || item.explanation.length < 100) {
      throw Error('Incomplete reviewed item: ' + item.sourceItem);
    }
    if (figureItems.has(item.sourceItem)) {
      if (!item.source_figure
          || !/^https:\/\/myschool\.ng\/storage\/classroom\/[A-Za-z0-9]+\.(?:png|jpeg)$/.test(item.source_figure.url)
          || item.source_figure.observed_at !== manifest.observed_at
          || typeof item.source_figure.transcription !== 'string'
          || item.source_figure.transcription.length < 100) {
        throw Error('Unverified source figure: ' + item.sourceItem);
      }
    } else if (item.source_figure) throw Error('Unexpected source figure: ' + item.sourceItem);
  }
  for (const held of manifest.remaining_held) {
    if (typeof held.reason !== 'string' || held.reason.length < 70) {
      throw Error('Unexplained held item: ' + held.sourceItem);
    }
  }
}

function prepareBatch(manifest, originalHolds, pool, ledger) {
  validateManifest(manifest, originalHolds);
  const nextPool = structuredClone(pool);
  const nextLedger = structuredClone(ledger);
  const existingStems = new Set(nextPool.questions.map(question => normalize(question.question)));
  const snapshot = {
    schema_version: 1, observed_at: manifest.observed_at, publisher: manifest.publisher,
    collection_year: manifest.collection_year, year_basis: manifest.year_basis,
    sitting_authenticated: false,
    description: 'Individually inspected complete source text and rendered figures; original adapted text-only practice and independently checked answers. No original sitting, official answer key, publisher licence, or question number asserted.',
    records: manifest.items.map(item => ({
      source_item: item.sourceItem, source_url: sourceUrl(item.sourceItem),
      source_observation: item.source_observation,
      ...(item.source_figure ? { source_figure: item.source_figure } : {}),
      adapted_prompt: item.question, options: item.options
    }))
  };
  const snapshotText = serialize(snapshot);
  const snapshotHash = sha(snapshotText);
  const receipt = {
    schema_version: 1, reviewed_at: manifest.observed_at, reviewer: 'Codex (AI)',
    source_file: snapshotPath, source_snapshot_sha256: snapshotHash,
    authority_note: 'Owner-directed adapted public-source practice with independent mathematical checks. Publisher collection label only; original sitting, official key, publisher licence, and teacher approval are not asserted.',
    records: []
  };
  for (const item of manifest.items) {
    const id = `mathematics-2023-myschool-${item.sourceItem}`;
    const sourceId = `owner-directed-myschool-${item.sourceItem}`;
    const url = sourceUrl(item.sourceItem);
    const question = {
      id, subject: 'mathematics', year: 2023, num: null,
      question: item.question, options: item.options, answer: item.answer,
      format: 4, has_diagram: false, topic: item.topic, explanation: item.explanation,
      verification: { method: 'ai-calculation-checked', reviewed_at: manifest.observed_at },
      source_provenance: { publisher: 'Myschool', url, year_basis: 'publisher-collection' }
    };
    const current = nextPool.questions.find(row => row.id === id);
    if (current && (current.source_provenance?.url !== url || current.num !== null)) {
      throw Error('Existing item has different provenance: ' + id);
    }
    if (!current && existingStems.has(normalize(question.question))) throw Error('Duplicate adapted prompt: ' + id);
    nextLedger.sources[sourceId] = {
      source_file: snapshotPath, content_sha256: snapshotHash, source_url: url,
      publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: 2023,
      official_answer_key: false,
      label: `Myschool publisher-labelled 2023 Mathematics revision item ${item.sourceItem}; sitting unconfirmed`,
      reuse_authorization: {
        status: 'authorized-by-owner', basis: 'owner-directed-public-source',
        scope: 'AfroTools past-question practice', material_sha256: snapshotHash,
        authorized_by: 'AfroTools owner', authorized_at: manifest.observed_at,
        instruction_ref: 'Owner direction to continue recent JAMB source review with adapted practice and independent answers. This does not claim publisher or exam-board permission.'
      }
    };
    const evidence = `${snapshotPath}#${item.sourceItem}; ${manifestPath}#${item.sourceItem}; ${path.basename(receiptPath)}#${id}; ${path.basename(checkerPath)}; tests/jamb-math-2023-held-recovery-04.test.js`;
    const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: manifest.observed_at, evidence };
    const fingerprint = questionFingerprint(question);
    nextLedger.questions[id] = {
      source_id: sourceId, content_sha256: fingerprint,
      question_review: { ...review }, answer_review: { ...review, reviewer_type: 'ai' },
      explanation_review: { ...review }
    };
    const assessment = assessQuestion(question, nextLedger);
    if (assessment.state !== 'eligible') throw Error('Intake rejected: ' + id + ': ' + assessment.reasons.join(', '));
    if (current) Object.assign(current, question);
    else nextPool.questions.push(question);
    existingStems.add(normalize(question.question));
    receipt.records.push({ id, source_item: item.sourceItem,
      content_sha256: fingerprint, answer: item.answer, publication_candidate: true });
  }
  nextPool.count = nextPool.questions.length;
  nextPool.answered_count = nextPool.questions.filter(row => row.answer).length;
  return { pool: nextPool, ledger: nextLedger, snapshot, snapshotText, receipt };
}

if (require.main === module) {
  const prepared = prepareBatch(read(manifestPath), read(originalHoldPath), read(poolPath), read(ledgerPath));
  for (const [name, content] of [
    [snapshotPath, prepared.snapshotText], [receiptPath, serialize(prepared.receipt)],
    [poolPath, JSON.stringify(prepared.pool) + '\n'], [ledgerPath, serialize(prepared.ledger)]
  ]) fs.writeFileSync(path.join(root, name), content);
  process.stdout.write(JSON.stringify({ accepted: prepared.receipt.records.length,
    held: read(manifestPath).remaining_held.length }) + '\n');
}

module.exports = { validateManifest, prepareBatch, snapshotPath, receiptPath };
