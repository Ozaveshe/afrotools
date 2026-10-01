'use strict';

// Source-faithful, owner-directed publisher-collection intake. Position is not exam numbering.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const checker = require('../jamb/verification/check-english-2024-1001.cjs');
const ROOT = path.resolve(__dirname, '../..');
const serialize = value => JSON.stringify(value, null, 2) + '\n';
const checkerPath = 'ops/jamb/verification/check-english-2024-1001.cjs';
const testPath = 'tests/jamb-english-2024-batch-04.test.js';
const norm = value => value.normalize('NFKC').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
function stemCore(text) {
  return norm(text.replace(/^.*?(?:completes the sentence|completes the gap|underlined)\.\s*/iu, '').replace(/\s+Target(?: word)?:.*$/iu, ''));
}
function duplicateQuestion(a,b) {
  const x=stemCore(a.question), y=stemCore(b.question);
  if (x !== y) return false;
  if (x.length > 45) return true;
  const target = q => norm(q.question.match(/Target(?: word)?:\s*(.*)$/iu)?.[1] || '');
  if (target(a) !== target(b)) return false;
  return JSON.stringify(Object.values(a.options).map(norm)) === JSON.stringify(Object.values(b.options).map(norm));
}

function prepareBatch(manifest, snapshot, independentReview, sourcePool, reviewLedger, options = {}) {
  const trust = checker.trustFor(options.referenceRoot);
  const answers = checker.validateManifest(manifest, snapshot, independentReview, options);
  const bytes = options.bytes || {
    manifest: Buffer.from(serialize(manifest)), snapshot: Buffer.from(serialize(snapshot)), review: Buffer.from(serialize(independentReview))
  };
  for (const [key, object] of Object.entries({ manifest, snapshot, review: independentReview })) {
    assert.equal(trust.questionFingerprint(JSON.parse(bytes[key])), trust.questionFingerprint(object), 'byte evidence must match parsed input');
  }
  const pool = structuredClone(sourcePool), ledger = structuredClone(reviewLedger);
  const snapshotHash = checker.sha(bytes.snapshot);
  const receipt = {
    schema_version: 1, reviewed_at: manifest.observed_at, reviewer: 'Codex (AI)',
    source_file: checker.snapshotPath, source_snapshot_sha256: snapshotHash,
    source_manifest_sha256: checker.sha(bytes.manifest), independent_review_sha256: checker.sha(bytes.review),
    year_basis: 'publisher-collection', sitting_authenticated: false, official_answer_key: false,
    implementation_base_sha: options.implementationBase || null,
    authority_note: 'Owner-directed use of complete source-faithful brief questions with independently checked answers and authored explanations. No authenticated sitting, official numbering, full paper, exam-board permission or publisher licence asserted.',
    records: []
  };
  for (const row of manifest.records) {
    const id = 'english-2024-myschool-' + row.source_question_id;
    const sourceId = 'owner-directed-myschool-english-2024-' + row.source_question_id;
    const question = {
      id, subject: 'english', year: 2024, num: null, question: row.question,
      options: Object.fromEntries(row.choices.map((text, index) => ['ABCD'[index], text])),
      answer: answers[row.source_question_id], format: 4, has_diagram: false, explanation: row.explanation,
      verification: { method: 'ai-source-checked', reviewed_at: manifest.observed_at },
      source_provenance: { publisher: 'Myschool', url: row.source_url, year_basis: 'publisher-collection' }
    };
    const fingerprint = trust.questionFingerprint(question), current = pool.questions.find(item => item.id === id);
    if (current && trust.questionFingerprint(current) !== fingerprint) throw Error('Existing intake content changed: ' + id);
    if (pool.questions.some(item => item.id !== id && (duplicateQuestion(item, question)
        || item.source_provenance?.url === row.source_url))) throw Error('Duplicate prompt or source identity: ' + id);
    if (Object.entries(ledger.sources).some(([key, source]) => key !== sourceId && source.source_url === row.source_url)) throw Error('Source URL is already owned by another ledger identity: ' + id);
    const source = {
      source_file: checker.snapshotPath, content_sha256: snapshotHash, source_url: row.source_url,
      publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: 2024,
      sitting_authenticated: false, official_answer_key: false,
      label: `Myschool publisher-labelled 2024 English collection item ${row.source_question_id}; sitting unconfirmed`,
      reuse_authorization: {
        status: 'authorized-by-owner', basis: 'owner-directed-public-source', scope: 'AfroTools past-question practice',
        material_sha256: snapshotHash, authorized_by: 'AfroTools owner', authorized_at: manifest.observed_at,
        instruction_ref: 'Owner instruction to use existing past questions, independently verify every answer, preserve source facts/options and continue this bounded English collection. This records owner direction, not publisher or exam-board permission.'
      }
    };
    const evidence = `${checker.manifestPath}#${row.source_question_id}; ${checker.snapshotPath}#${row.source_question_id}; ${checker.reviewPath}#${row.source_question_id}; ${checker.receiptPath}#${id}; ${checkerPath}; ${testPath}`;
    const acceptedReview = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: manifest.observed_at, evidence };
    const questionReview = { source_id: sourceId, content_sha256: fingerprint,
      question_review: { ...acceptedReview }, answer_review: { ...acceptedReview, reviewer_type: 'ai' }, explanation_review: { ...acceptedReview } };
    if (ledger.sources[sourceId] && trust.questionFingerprint(ledger.sources[sourceId]) !== trust.questionFingerprint(source)) throw Error('Existing source review differs: ' + sourceId);
    if (ledger.questions[id] && trust.questionFingerprint(ledger.questions[id]) !== trust.questionFingerprint(questionReview)) throw Error('Existing question review differs: ' + id);
    ledger.sources[sourceId] = source; ledger.questions[id] = questionReview;
    const assessment = trust.assessQuestion(question, ledger);
    if (assessment.state !== 'eligible') throw Error('Publication trust gate rejected ' + id + ': ' + assessment.reasons.join(', '));
    if (!current) pool.questions.push(question);
    receipt.records.push({ id, source_question_id: row.source_question_id, source_item: row.source_item,
      source_url: row.source_url, source_prompt_sha256: row.source_prompt_sha256, content_sha256: fingerprint,
      answer: answers[row.source_question_id], independently_selected_answer: checker.ANSWER_TEXT[row.source_question_id],
      independent_source_urls: row.independent_source_urls, publication_candidate: true });
  }
  pool.count = pool.questions.length; pool.answered_count = pool.questions.filter(row => row.answer).length;
  const result = checker.verify(manifest, snapshot, independentReview, pool, ledger, receipt, bytes, options);
  return { pool, ledger, receipt, bytes, result };
}

function main() {
  const args = process.argv.slice(2), apply = args.includes('--apply'), dryRun = args.includes('--dry-run');
  if (apply === dryRun) throw Error('Choose exactly one of --dry-run or --apply; no default writes');
  const value = flag => args.includes(flag) ? args[args.indexOf(flag) + 1] : null;
  const referenceArg = value('--reference-repo');
  if (apply && referenceArg) throw Error('--reference-repo is a read-only private preflight option');
  const referenceRoot = referenceArg ? path.resolve(referenceArg) : ROOT;
  let implementationBase = null;
  if (apply) {
    implementationBase = value('--base');
    if (!/^[a-f0-9]{40}$/.test(implementationBase || '')) throw Error('Apply requires the coordinator-provided verified new origin/main SHA');
    const git = args => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8' }).trim();
    if (git(['rev-parse', 'HEAD']) !== implementationBase || git(['rev-parse', 'origin/main']) !== implementationBase) throw Error('Checkout must start at the provided verified origin/main');
    if (!git(['branch', '--show-current']) || git(['branch', '--show-current']) === 'main') throw Error('Apply requires the separately prepared intake branch/worktree');
  }
  const bytes = Object.fromEntries([['manifest', checker.manifestPath], ['snapshot', checker.snapshotPath], ['review', checker.reviewPath]].map(([key, relative]) => [key, fs.readFileSync(path.join(ROOT, relative))]));
  const readReference = relative => JSON.parse(fs.readFileSync(path.join(referenceRoot, relative), 'utf8'));
  const prepared = prepareBatch(JSON.parse(bytes.manifest), JSON.parse(bytes.snapshot), JSON.parse(bytes.review),
    readReference('ops/jamb/source-pool.json'), readReference('data/jamb/review-ledger.json'), { referenceRoot, bytes, implementationBase });
  if (apply) {
    // Complete validation precedes every write; the coordinated release owns publication generation.
    for (const [relative, text] of [
      ['ops/jamb/source-pool.json', JSON.stringify(prepared.pool) + '\n'],
      ['data/jamb/review-ledger.json', serialize(prepared.ledger)], [checker.receiptPath, serialize(prepared.receipt)]
    ]) fs.writeFileSync(path.join(ROOT, relative), text);
  }
  process.stdout.write(JSON.stringify({ mode: apply ? 'applied-intake' : 'private-read-only-preflight',
    accepted: prepared.result.accepted, held_or_excluded: prepared.result.held_or_excluded,
    source_year_basis: 'publisher-collection', sitting_authenticated: false, implementation_base_sha: implementationBase,
    wrote_repository_files: apply, question_hashes: prepared.receipt.records.map(row => ({ id: row.id, content_sha256: row.content_sha256 })) }) + '\n');
}
if (require.main === module) main();
module.exports = { prepareBatch, validateManifest: checker.validateManifest, stemCore, duplicateQuestion };
