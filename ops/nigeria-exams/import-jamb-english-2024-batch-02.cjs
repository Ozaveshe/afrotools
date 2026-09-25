'use strict';

// Replays eighteen owner-directed, short adapted revision items. Myschool's year
// label is a publisher collection label, not proof of a 2024 UTME sitting.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');

const manifestPath = 'ops/nigeria-exams/jamb-english-2024-curated-batch-02.json';
const batchPath = 'ops/jamb/verification/english-2024-publishable-903.json';
const checkerPath = 'ops/jamb/verification/check-english-2024-903.cjs';
const reviewedAt = '2026-09-25';
const expectedItems = [12, 13, 16, 17, 33, 34, 36, 37, 38, 39, 40, 41, 44, 46, 47, 51, 52, 55];
const auditedItems = Array.from({ length: 44 }, (_, i) => i + 12);

function read(relative) {
  return JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
}

function write(relative, value) {
  fs.writeFileSync(path.join(root, relative), JSON.stringify(value, null, 2) + '\n');
}

function validateManifest(manifest) {
  if (manifest.schema_version !== 1 || manifest.publisher !== 'Myschool'
      || manifest.collection_year !== 2024 || manifest.year_basis !== 'publisher-collection'
      || !Array.isArray(manifest.records) || manifest.records.length !== expectedItems.length
      || !Array.isArray(manifest.held_source_items)) {
    throw Error('Unexpected 2024 English source manifest');
  }
  const actualItems = manifest.records.map(row => row.source_item).sort((a, b) => a - b);
  if (JSON.stringify(actualItems) !== JSON.stringify(expectedItems)) {
    throw Error('2024 English source item set changed without review');
  }
  const held = new Set(manifest.held_source_items.map(row => row.source_item));
  if (actualItems.some(item => held.has(item))) throw Error('Held source item cannot be imported');
  if (JSON.stringify([...actualItems, ...held].sort((a, b) => a - b)) !== JSON.stringify(auditedItems)) {
    throw Error('The 44-position audit must classify every position exactly once');
  }
  for (const row of manifest.records) {
    const url = new URL(row.source_url);
    if (!Number.isInteger(row.source_question_id)
        || url.origin !== 'https://myschool.ng'
        || url.pathname !== `/classroom/english-language/${row.source_question_id}`
        || url.searchParams.get('exam_type') !== 'jamb'
        || url.searchParams.get('exam_year') !== '2024'
        || !Array.isArray(row.choices) || row.choices.length !== 4
        || row.choices.some(choice => typeof choice !== 'string' || !choice.trim())
        || !'ABCD'.includes(row.answer) || row.answer.length !== 1
        || typeof row.source_observation !== 'string' || row.source_observation.length < 30
        || !Array.isArray(row.independent_source_urls) || row.independent_source_urls.length === 0
        || row.independent_source_urls.some(link => !link.startsWith('https://') || link === row.source_url)) {
      throw Error('Invalid curated 2024 English item: ' + row.source_item);
    }
  }
}

function prepareBatch(manifest, manifestHash, sourcePool, reviewLedger) {
  validateManifest(manifest);
  if (!/^[a-f0-9]{64}$/.test(manifestHash)) throw Error('Invalid source hash');
  const pool = structuredClone(sourcePool);
  const ledger = structuredClone(reviewLedger);
  const records = [];
  const knownStems = new Set(pool.questions.map(candidate => candidate.question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()));
  for (const row of manifest.records) {
    const id = `english-2024-myschool-${row.source_question_id}`;
    const sourceId = `owner-directed-myschool-english-2024-${row.source_question_id}`;
    const previousSource = ledger.sources[sourceId];
    if (previousSource && previousSource.content_sha256 !== manifestHash) {
      throw Error('Existing source review differs: ' + sourceId);
    }
    ledger.sources[sourceId] = {
      source_file: manifestPath,
      content_sha256: manifestHash,
      source_url: row.source_url,
      publisher: manifest.publisher,
      year_basis: manifest.year_basis,
      collection_year: manifest.collection_year,
      official_answer_key: false,
      label: `Myschool publisher-labelled 2024 English revision item ${row.source_item}; sitting unconfirmed`,
      reuse_authorization: {
        status: 'authorized-by-owner',
        basis: 'owner-directed-public-source',
        scope: 'AfroTools past-question practice',
        material_sha256: manifestHash,
        authorized_by: 'AfroTools owner',
        authorized_at: reviewedAt,
        instruction_ref: 'Owner instruction in this thread to use existing past questions and independently check online answers; this is owner direction, not a publisher or exam-board licence.'
      }
    };
    const choices = Object.fromEntries(row.choices.map((choice, index) => ['ABCD'[index], choice]));
    const question = {
      id,
      subject: 'english',
      year: 2024,
      num: null,
      question: row.question,
      options: choices,
      answer: row.answer,
      format: 4,
      has_diagram: false,
      explanation: row.explanation,
      verification: { method: 'ai-source-checked', reviewed_at: reviewedAt },
      source_provenance: { publisher: manifest.publisher, url: row.source_url, year_basis: manifest.year_basis }
    };
    const fingerprint = questionFingerprint(question);
    const evidence = `${manifestPath}#${row.source_item}; ${batchPath}#${id}; ${checkerPath}`;
    const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: reviewedAt, evidence };
    const existingQuestion = pool.questions.find(candidate => candidate.id === id);
    const normalizedStem = question.question.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
    if (knownStems.has(normalizedStem) && !existingQuestion) {
      throw Error('Duplicate question stem: ' + id);
    }
    knownStems.add(normalizedStem);
    if (existingQuestion && questionFingerprint(existingQuestion) !== fingerprint) {
      throw Error('Existing question differs: ' + id);
    }
    const existingReview = ledger.questions[id];
    if (existingReview && existingReview.content_sha256 !== fingerprint) {
      throw Error('Existing review differs: ' + id);
    }
    ledger.questions[id] = {
      source_id: sourceId,
      content_sha256: fingerprint,
      question_review: { ...review },
      answer_review: { ...review, reviewer_type: 'ai' },
      explanation_review: { ...review }
    };
    const assessment = assessQuestion(question, ledger);
    if (assessment.state !== 'eligible') {
      throw Error(`Curated item failed publication gate: ${id}: ${assessment.reasons.join(', ')}`);
    }
    if (!existingQuestion) pool.questions.push(question);
    records.push({
      id,
      content_sha256: fingerprint,
      source_item: row.source_item,
      source_url: row.source_url,
      source_observation: row.source_observation,
      independent_source_urls: row.independent_source_urls,
      independent_reasoning: row.explanation,
      independently_selected_answer: choices[row.answer],
      publication_candidate: true
    });
  }
  pool.count = pool.questions.length;
  pool.answered_count = pool.questions.filter(question => question.answer).length;
  const batch = {
    schema_version: 1,
    reviewed_at: reviewedAt,
    reviewer: 'Codex (AI)',
    source_file: manifestPath,
    source_snapshot_sha256: manifestHash,
    year_basis: manifest.year_basis,
    authority_note: 'Owner-directed use of brief adapted public-source items. No official sitting, paper order, official answer key or publisher licence asserted.',
    records
  };
  return { pool, ledger, batch };
}

function main() {
  const bytes = fs.readFileSync(path.join(root, manifestPath));
  const hash = crypto.createHash('sha256').update(bytes).digest('hex');
  const result = prepareBatch(JSON.parse(bytes), hash,
    read('ops/jamb/source-pool.json'), read('data/jamb/review-ledger.json'));
  fs.writeFileSync(path.join(root, 'ops/jamb/source-pool.json'), JSON.stringify(result.pool) + '\n');
  write('data/jamb/review-ledger.json', result.ledger);
  write(batchPath, result.batch);
  console.log(JSON.stringify({ imported: result.batch.records.length, held: read(manifestPath).held_source_items.length,
    source_year_basis: result.batch.year_basis, authenticated_sitting: false }));
}

if (require.main === module) main();
module.exports = { prepareBatch, validateManifest, manifestPath, batchPath, checkerPath };
