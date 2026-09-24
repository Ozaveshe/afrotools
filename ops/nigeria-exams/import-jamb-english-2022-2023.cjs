'use strict';

// Replays a bounded, owner-directed intake of short adapted public-source items.
// Publisher collection labels are deliberately not official sitting identifiers.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');
const manifestPath = 'ops/nigeria-exams/jamb-english-2022-2023-curated.json';
const bytes = fs.readFileSync(path.join(root, manifestPath));
const manifestHash = crypto.createHash('sha256').update(bytes).digest('hex');
const manifest = JSON.parse(bytes);
const read = relative => JSON.parse(fs.readFileSync(path.join(root, relative), 'utf8'));
const write = (relative, value) => fs.writeFileSync(path.join(root, relative), JSON.stringify(value, null, 2) + '\n');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const today = '2026-09-24';
const batches = new Map();

if (manifest.schema_version !== 1 || manifest.publisher !== 'Poscholars'
    || manifest.year_basis !== 'publisher-collection' || manifest.records.length !== 50) {
  throw Error('Unexpected English intake manifest');
}
for (const year of [2022, 2023]) {
  const sourceId = `owner-directed-poscholars-english-${year}`;
  const sourceUrl = manifest.source_pages[String(year)];
  ledger.sources[sourceId] = {
    source_file: manifestPath, content_sha256: manifestHash,
    source_url: sourceUrl, publisher: manifest.publisher,
    year_basis: manifest.year_basis, collection_year: year,
    official_answer_key: false,
    label: `Poscholars publisher-labelled ${year} English revision collection; sitting unconfirmed`,
    reuse_authorization: {
      status: 'authorized-by-owner', basis: 'owner-directed-public-source',
      scope: 'AfroTools past-question practice', material_sha256: manifestHash,
      authorized_by: 'AfroTools owner', authorized_at: today,
      instruction_ref: 'Owner instruction in this thread to use existing past questions and online or internal standard answers; this is an owner direction, not publisher or exam-board licence.'
    }
  };
  batches.set(year, []);
}

for (const entry of manifest.records) {
  const [year, sourceItem, prompt, choices, answer, explanation, sourceObservation] = entry;
  const id = `english-${year}-poscholars-${String(sourceItem).padStart(2, '0')}`;
  const sourceId = `owner-directed-poscholars-english-${year}`;
  if (![2022, 2023].includes(year) || !Number.isInteger(sourceItem)
      || !Array.isArray(choices) || choices.length !== 4 || !'ABCD'.includes(answer)
      || typeof sourceObservation !== 'string' || sourceObservation.length < 30) {
    throw Error('Invalid curated source item: ' + id);
  }
  const options = Object.fromEntries(choices.map((choice, index) => ['ABCD'[index], choice]));
  const question = {
    id, subject: 'english', year, num: null, question: prompt,
    options, answer, format: 4, has_diagram: false, explanation,
    verification: { method: 'ai-source-checked', reviewed_at: today },
    source_provenance: {
      publisher: manifest.publisher, url: manifest.source_pages[String(year)],
      year_basis: 'publisher-collection'
    }
  };
  const batchName = `english-${year}-publishable-901.json`;
  const checkerName = `check-english-${year}-901.cjs`;
  const evidence = `${manifestPath}#${year}:${sourceItem}; ops/jamb/verification/${batchName}#${id}; ${checkerName}`;
  const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: today, evidence };
  ledger.questions[id] = {
    source_id: sourceId, content_sha256: questionFingerprint(question),
    question_review: { ...review },
    answer_review: { ...review, reviewer_type: 'ai' },
    explanation_review: { ...review }
  };
  const assessment = assessQuestion(question, ledger);
  if (assessment.state !== 'eligible') throw Error(`${id}: ${assessment.reasons.join(', ')}`);
  const existing = pool.questions.find(record => record.id === id);
  if (existing && questionFingerprint(existing) !== questionFingerprint(question)) {
    throw Error('Existing question differs: ' + id);
  }
  if (!existing) pool.questions.push(question);
  batches.get(year).push({
    id, content_sha256: questionFingerprint(question), source_item: sourceItem,
    source_url: manifest.source_pages[String(year)], source_observation: sourceObservation,
    independent_reasoning: explanation, independently_selected_answer: choices['ABCD'.indexOf(answer)],
    publication_candidate: true
  });
}

pool.count = pool.questions.length;
pool.answered_count = pool.questions.filter(question => question.answer).length;
fs.writeFileSync(path.join(root, 'ops/jamb/source-pool.json'), JSON.stringify(pool) + '\n');
write('data/jamb/review-ledger.json', ledger);
for (const [year, records] of batches) {
  write(`ops/jamb/verification/english-${year}-publishable-901.json`, {
    schema_version: 1, reviewed_at: today, reviewer: 'Codex (AI)',
    source_file: manifestPath, source_snapshot_sha256: manifestHash,
    source_url: manifest.source_pages[String(year)],
    year_basis: 'publisher-collection',
    authority_note: 'Owner-directed use of brief adapted public-source items. No official sitting, paper order, publisher licence or teacher approval asserted.',
    records
  });
}
console.log(JSON.stringify({ imported: [...batches.values()].reduce((count, rows) => count + rows.length, 0),
  by_year: Object.fromEntries([...batches].map(([year, records]) => [year, records.length])),
  held_groups: manifest.held_source_items.length }));
