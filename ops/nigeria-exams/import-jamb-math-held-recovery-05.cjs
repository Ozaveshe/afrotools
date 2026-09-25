'use strict';

// Recover only individually checked, adapted items from held publisher collections.
// Collection years and positions are publisher labels, not authenticated UTME papers.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { questionFingerprint, assessQuestion } = require('../../scripts/lib/jamb-content-trust');

const root = path.resolve(__dirname, '../..');
const manifestPath = 'ops/nigeria-exams/jamb-math-2024-2025-held-recovery-05.json';
const poolPath = 'ops/jamb/source-pool.json';
const ledgerPath = 'data/jamb/review-ledger.json';
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const sha = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const snapshotPath = year => `ops/nigeria-exams/jamb-math-${year}-source-snapshot-05.json`;
const receiptPath = year => `ops/jamb/verification/mathematics-${year}-publishable-${year === 2024 ? '004' : '005'}.json`;
const checkerPath = year => `ops/jamb/verification/check-mathematics-${year}-${year === 2024 ? '004' : '005'}.cjs`;

function validateManifest(manifest) {
  if (manifest.schema_version !== 1 || manifest.observed_at !== '2026-09-25'
      || manifest.publisher !== 'Myschool' || manifest.year_basis !== 'publisher-collection'
      || manifest.sitting_authenticated !== false || !Array.isArray(manifest.items)
      || !Array.isArray(manifest.remaining_held) || manifest.items.length !== 11
      || manifest.remaining_held.length !== 8) {
    throw Error('Unexpected Mathematics held-recovery provenance or size');
  }
  const expected = ['2024:70195:15', '2024:70291:37', '2024:70347:45', '2025:74091:2',
    '2025:74156:19', '2025:74175:34', '2025:74176:35', '2025:74188:40',
    '2025:74194:46', '2025:74195:47', '2025:74200:52'];
  const actual = manifest.items.map(x => `${x.year}:${x.sourceItem}:${x.position}`);
  if (JSON.stringify(actual) !== JSON.stringify(expected)) throw Error('Unexpected source item or collection position');
  const allIds = [...manifest.items, ...manifest.remaining_held].map(x => x.sourceItem);
  if (new Set(allIds).size !== allIds.length || allIds.some(id => !/^\d{5}$/.test(id))) {
    throw Error('Duplicate or invalid source item');
  }
  for (const item of manifest.items) {
    if (typeof item.topic !== 'string' || item.topic.length < 3
        || typeof item.question !== 'string' || item.question.length < 20
        || !item.options || Object.keys(item.options).sort().join('') !== 'ABCD'
        || new Set(Object.values(item.options)).size !== 4
        || !'ABCD'.includes(item.answer) || item.answer.length !== 1
        || typeof item.explanation !== 'string' || item.explanation.length < 65
        || typeof item.source_repair !== 'string' || item.source_repair.length < 30
        || (item.source_figure && (!/^https:\/\/myschool\.ng\/storage\/classroom\//.test(item.source_figure.url)
          || item.source_figure.observed_at !== manifest.observed_at
          || item.source_figure.transcription.length < 90))) {
      throw Error('Incomplete recovered item: ' + item.sourceItem);
    }
  }
  for (const item of manifest.remaining_held) {
    if (![2024, 2025].includes(item.year) || typeof item.reason !== 'string' || item.reason.length < 30) {
      throw Error('Unexplained hold: ' + item.sourceItem);
    }
  }
}

function prepareBatch(manifest, pool, ledger) {
  validateManifest(manifest);
  const nextPool = structuredClone(pool);
  const nextLedger = structuredClone(ledger);
  const existingPrompts = new Set(nextPool.questions.map(q => normalize(q.question)));
  const outputs = {};
  for (const year of [2024, 2025]) {
    const items = manifest.items.filter(item => item.year === year);
    const snapshot = {
      schema_version: 1, observed_at: manifest.observed_at, publisher: manifest.publisher,
      collection_year: year, year_basis: manifest.year_basis, sitting_authenticated: false,
      description: 'Visually inspected publisher item pages with adapted, independently solved questions. Collection year and position do not authenticate an original UTME sitting, official key, or exam-board licence.',
      records: items.map(item => ({
        collection_position: item.position, source_item: item.sourceItem,
        source_url: `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=${year}`,
        adapted_prompt: item.question, options: item.options,
        source_figure: item.source_figure || null, source_repair: item.source_repair
      }))
    };
    const snapshotText = serialize(snapshot);
    const snapshotHash = sha(snapshotText);
    const receipt = {
      schema_version: 1, reviewed_at: manifest.observed_at, reviewer: 'Codex (AI)',
      source_file: snapshotPath(year), source_snapshot_sha256: snapshotHash,
      authority_note: 'Owner-directed public-source use for adapted practice; each answer independently recalculated. No authenticated sitting, official answer key, publisher or exam-board licence, or teacher approval asserted.',
      records: []
    };
    for (const item of items) {
      const id = `mathematics-${year}-myschool-${item.sourceItem}`;
      const sourceId = `owner-directed-myschool-${item.sourceItem}`;
      const url = `https://myschool.ng/classroom/mathematics/${item.sourceItem}?exam_type=jamb&exam_year=${year}`;
      const question = {
        id, subject: 'mathematics', year, num: null, question: item.question,
        options: item.options, answer: item.answer, format: 4, has_diagram: false,
        topic: item.topic, explanation: item.explanation,
        verification: { method: 'ai-calculation-checked', reviewed_at: manifest.observed_at },
        source_provenance: { publisher: manifest.publisher, url, year_basis: manifest.year_basis }
      };
      const current = nextPool.questions.find(q => q.id === id);
      if (current && (current.source_provenance?.url !== url || current.num !== null)) {
        throw Error('Existing item has different provenance: ' + id);
      }
      if (!current && existingPrompts.has(normalize(question.question))) throw Error('Duplicate adapted prompt: ' + id);
      nextLedger.sources[sourceId] = {
        source_file: snapshotPath(year), content_sha256: snapshotHash, source_url: url,
        publisher: manifest.publisher, year_basis: manifest.year_basis, collection_year: year,
        official_answer_key: false,
        label: `Myschool publisher-labelled ${year} Mathematics revision item ${item.position}; sitting unconfirmed`,
        reuse_authorization: {
          status: 'authorized-by-owner', basis: 'owner-directed-public-source',
          scope: 'AfroTools past-question practice', material_sha256: snapshotHash,
          authorized_by: 'AfroTools owner', authorized_at: manifest.observed_at,
          instruction_ref: 'Owner direction to continue recent JAMB source review with adapted practice and independent answers. This does not claim publisher or exam-board permission.'
        }
      };
      const evidence = `${snapshotPath(year)}#${item.sourceItem}; ${manifestPath}#${item.sourceItem}; ${path.basename(receiptPath(year))}#${id}; ${path.basename(checkerPath(year))}; tests/jamb-math-held-recovery-05.test.js`;
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
      existingPrompts.add(normalize(question.question));
      receipt.records.push({ id, source_item: item.sourceItem, collection_position: item.position,
        content_sha256: fingerprint, answer: item.answer, publication_candidate: true });
    }
    outputs[year] = { snapshot, snapshotText, receipt };
  }
  nextPool.count = nextPool.questions.length;
  nextPool.answered_count = nextPool.questions.filter(q => q.answer).length;
  return { pool: nextPool, ledger: nextLedger, outputs };
}

if (require.main === module) {
  const prepared = prepareBatch(read(manifestPath), read(poolPath), read(ledgerPath));
  for (const year of [2024, 2025]) {
    fs.writeFileSync(path.join(root, snapshotPath(year)), prepared.outputs[year].snapshotText);
    fs.writeFileSync(path.join(root, receiptPath(year)), serialize(prepared.outputs[year].receipt));
  }
  fs.writeFileSync(path.join(root, poolPath), JSON.stringify(prepared.pool) + '\n');
  fs.writeFileSync(path.join(root, ledgerPath), serialize(prepared.ledger));
  process.stdout.write(JSON.stringify({ accepted: [2024, 2025].map(year => prepared.outputs[year].receipt.records.length),
    held: read(manifestPath).remaining_held.length }) + '\n');
}

module.exports = { validateManifest, prepareBatch, snapshotPath, receiptPath };
