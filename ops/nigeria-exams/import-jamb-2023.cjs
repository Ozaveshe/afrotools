'use strict';

// Bounded intake of eight individually inspected mathematical source items.
// This records the owner's online-sourcing instruction, not a publisher licence.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '../..');
const { questionFingerprint, assessQuestion } = require(path.join(root, 'scripts/lib/jamb-content-trust'));
const bank = require(path.join(root, 'assets/js/lib/jamb-recent-written-bank'));
const read = name => JSON.parse(fs.readFileSync(path.join(root, name), 'utf8'));
const write = (name, value) => fs.writeFileSync(path.join(root, name), JSON.stringify(value, null, 2) + '\n');
const pool = read('ops/jamb/source-pool.json');
const ledger = read('data/jamb/review-ledger.json');
const choices = [
  [{ A: '(8 − 1)!', B: '8!/2!', C: '8!/(2! × 2!)', D: '8!' }, 'C'],
  [{ A: '2', B: '0', C: '2^0', D: '1/2' }, 'A'],
  [{ A: '−49', B: '64', C: '113', D: '15' }, 'D'],
  [{ A: '−5/8', B: '−8/5', C: '8/5', D: '5/8' }, 'B'],
  [{ A: '15.44%', B: '15.43%', C: '15.42%', D: '15.45%' }, 'D']
];
const expectedItems = ['67243', '67244', '67245', '67248', '67251'];
if (bank.items.length !== 5 || bank.items.some((item, i) => item.sourceItem !== expectedItems[i])) throw Error('Unexpected intake bank');
const intake = read('ops/nigeria-exams/jamb-2023-mathematics-intake.json');
for (const item of bank.items) {
  const evidence = intake.records.find(record => record.source_item === item.sourceItem);
  if (!evidence || evidence.source_url !== item.source
      || evidence.prompt_sha256 !== crypto.createHash('sha256').update(item.prompt).digest('hex')
      || evidence.reasoning !== item.steps.join(' ')) throw Error('Previously reviewed source or solution changed: ' + item.sourceItem);
}
const snapshotPath = 'ops/nigeria-exams/jamb-2023-source-snapshot.json';
const additionalBytes = fs.readFileSync(path.join(root, 'ops/nigeria-exams/jamb-2023-additional-math.json'));
if (crypto.createHash('sha256').update(additionalBytes).digest('hex') !== 'f2be45c675ed7437d69683d81d1ee4b2b565c79935192151a4abddec501e61f5') throw Error('Additional reviewed content changed');
const additional = JSON.parse(additionalBytes).items;
const items = bank.items.concat(additional);
choices.push(...additional.map(item => [item.options, item.answer]));
const snapshot = { schema_version: 1, observed_at: '2026-09-16',
  description: 'Curated source observations with adapted mathematical prompts and normalized numeric choices; not raw page HTML. Publisher collection year only.',
  records: items.map((item, i) => ({ source_url: item.source, publisher: 'Myschool',
    collection_year: 2023, source_item: item.sourceItem, adapted_prompt: item.prompt, options: choices[i][0] })) };
const snapshotText = JSON.stringify(snapshot, null, 2) + '\n';
const hash = crypto.createHash('sha256').update(snapshotText).digest('hex');
const batchName = 'math-2023-publishable-001.json';
const checker = 'check-math-2023-001.cjs';
const records = [];
items.forEach((item, i) => {
  const id = 'mathematics-2023-myschool-' + item.sourceItem;
  const sourceId = 'owner-directed-myschool-' + item.sourceItem;
  const question = { id, subject: 'mathematics', year: 2023, num: null,
    question: item.prompt, options: choices[i][0], answer: choices[i][1], format: 4, has_diagram: false,
    topic: item.title, explanation: item.steps.join(' '),
    verification: { method: 'ai-calculation-checked', reviewed_at: '2026-09-16' },
    source_provenance: { publisher: 'Myschool', url: item.source, year_basis: 'publisher-collection' } };
  ledger.sources[sourceId] = { source_file: snapshotPath, content_sha256: hash,
    source_url: item.source, publisher: 'Myschool', year_basis: 'publisher-collection', collection_year: 2023,
    official_answer_key: false,
    reuse_authorization: { status: 'authorized-by-owner', basis: 'owner-directed-public-source',
      scope: 'AfroTools past-question practice', material_sha256: hash, authorized_by: 'AfroTools owner',
      authorized_at: '2026-09-16',
      instruction_ref: 'User instruction in this task: "yes we can use existing past questions" and "check online or internally"; authorization recorded on this date, not an exam-board licence.' } };
  const review = { status: 'accepted', reviewer: 'Codex (AI)', reviewed_at: '2026-09-16',
    evidence: snapshotPath + '#' + item.sourceItem + '; ' + batchName + '#' + id + '; ' + checker };
  ledger.questions[id] = { source_id: sourceId, content_sha256: questionFingerprint(question),
    question_review: { ...review }, answer_review: { ...review, reviewer_type: 'ai' }, explanation_review: { ...review } };
  if (assessQuestion(question, ledger).state !== 'eligible') throw Error('Intake rejected: ' + id);
  const existing = pool.questions.find(q => q.id === id);
  if (existing && questionFingerprint(existing) !== questionFingerprint(question)) throw Error('Existing question differs: ' + id);
  if (!existing) pool.questions.push(question);
  records.push({ id, content_sha256: questionFingerprint(question), source_item: item.sourceItem,
    answer: question.answer, publication_candidate: true });
});
fs.writeFileSync(path.join(root, snapshotPath), snapshotText);
pool.count = pool.questions.length;
pool.answered_count = pool.questions.filter(q => q.answer).length;
fs.writeFileSync(path.join(root, 'ops/jamb/source-pool.json'), JSON.stringify(pool) + '\n');
write('data/jamb/review-ledger.json', ledger);
write('ops/jamb/verification/' + batchName, { schema_version: 1, reviewed_at: '2026-09-16',
  reviewer: 'Codex (AI)', source_file: snapshotPath, source_snapshot_sha256: hash,
  authority_note: 'Owner-directed public source use. Publisher collection year, not an authenticated sitting. Original solutions; no exam-board licence or teacher approval asserted.', records });
console.log(JSON.stringify({ imported: records.length, ids: records.map(r => r.id) }));
