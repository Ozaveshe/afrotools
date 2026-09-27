#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { questionFingerprint } = require('./lib/jamb-content-trust');
const { reviewed, seal } = require('./lib/jamb-publication');

const ROOT = path.resolve(__dirname, '..');
const SOURCE = 'ops/nigeria-exams/jamb-original-practice-v1.json';
const OUTPUT = 'data/jamb/pools/original-practice.json';
const INDEX = 'data/jamb/pools/original-practice-index.json';
const SYLLABUS = Object.freeze({
  mathematics: 'https://ibass.jamb.gov.ng/assets/uploads/Mathematics.pdf',
  english: 'https://ibass.jamb.gov.ng/assets/uploads/Use-of-English.pdf'
});
const PUBLIC_FIELDS = ['id', 'subject', 'year', 'num', 'topic', 'question', 'passage', 'options', 'answer', 'explanation'];

function assert(condition, message) { if (!condition) throw new Error(message); }
function validate(source) {
  assert(source?.schema_version === 1 && source.collection_id === 'afrotools-original-jamb-practice-v1', 'Invalid original-practice manifest');
  assert(source.provenance?.includes('Original AfroTools practice'), 'Missing original-work provenance');
  assert(Array.isArray(source.questions) && source.questions.length === 24, 'The pilot must contain exactly 24 reviewed items');
  const ids = new Set();
  const fingerprints = new Set();
  const bySubject = { mathematics: 0, english: 0 };
  for (const q of source.questions) {
    assert(q && typeof q === 'object' && Object.hasOwn(SYLLABUS, q.subject), 'Unsupported original-practice subject');
    assert(typeof q.id === 'string' && /^ato-(math|english)-v1-\d{2}$/.test(q.id) && !ids.has(q.id), 'Invalid or duplicate item ID: ' + q.id);
    ids.add(q.id);
    bySubject[q.subject]++;
    assert(q.year === null && q.num === null && !Object.hasOwn(q, 'source_provenance'), 'Original practice cannot have a historical sitting: ' + q.id);
    assert(q.origin === 'AfroTools original' && q.syllabus_url === SYLLABUS[q.subject], 'Missing authored provenance or official syllabus link: ' + q.id);
    assert(typeof q.topic === 'string' && q.topic.trim() && typeof q.objective === 'string' && q.objective.trim(), 'Missing syllabus area or learning objective: ' + q.id);
    assert(typeof q.question === 'string' && q.question.length >= 20 && typeof q.explanation === 'string' && q.explanation.length >= 30, 'Incomplete question or explanation: ' + q.id);
    assert(q.options && Object.keys(q.options).sort().join('') === 'ABCD'
      && Object.values(q.options).every(value => typeof value === 'string' && value.trim())
      && new Set(Object.values(q.options).map(value => value.trim().toLowerCase())).size === 4,
    'Incomplete or repeated options: ' + q.id);
    assert(Object.hasOwn(q.options, q.answer), 'Missing answer key: ' + q.id);
    assert(typeof q.review?.independent_check === 'string' && q.review.independent_check.length >= 30, 'Missing independent check: ' + q.id);
    const { review, ...content } = q;
    const fingerprint = questionFingerprint(content);
    assert(review.content_sha256 === fingerprint && !fingerprints.has(fingerprint), 'Review fingerprint changed or duplicated: ' + q.id);
    fingerprints.add(fingerprint);
  }
  assert(bySubject.mathematics === 12 && bySubject.english === 12, 'Expected 12 Mathematics and 12 Use of English items');
  return source;
}

function publicQuestion(q) {
  return reviewed({ ...Object.fromEntries(PUBLIC_FIELDS.filter(key => Object.hasOwn(q, key)).map(key => [key, q[key]])), format: 4 });
}
function publications(source) {
  validate(source);
  const revision = questionFingerprint(source);
  const questions = source.questions.map(publicQuestion);
  const provenance = 'AfroTools original questions aligned with JAMB syllabus; not an official JAMB paper or past-question collection.';
  const outputs = {
    [OUTPUT]: seal({ kind: 'original-practice', collection_id: source.collection_id,
      count: questions.length, answered_count: questions.length, provenance, questions }, revision),
    [INDEX]: seal({ kind: 'original-practice', collection_id: source.collection_id,
      count: questions.length, subjects: { mathematics: 12, english: 12 }, provenance }, revision)
  };
  return { revision, outputs };
}
function build(root = ROOT, check = false) {
  const source = JSON.parse(fs.readFileSync(path.join(root, SOURCE), 'utf8'));
  const { outputs } = publications(source);
  for (const [relative, payload] of Object.entries(outputs)) {
    const target = path.join(root, relative);
    const text = JSON.stringify(payload, null, 2) + '\n';
    if (check) assert(fs.existsSync(target) && fs.readFileSync(target, 'utf8') === text, 'Original-practice publication is missing or stale: ' + relative);
    else if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== text) {
      fs.mkdirSync(path.dirname(target), { recursive: true });
      fs.writeFileSync(target, text);
    }
  }
  return { items: source.questions.length, subjects: { mathematics: 12, english: 12 }, outputs: Object.keys(outputs) };
}

if (require.main === module) console.log(JSON.stringify(build(ROOT, process.argv.includes('--check'))));
module.exports = { validate, publicQuestion, publications, build, SOURCE, OUTPUT, INDEX };
