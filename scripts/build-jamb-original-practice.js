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
const OFFICIAL_PORTAL = 'https://ibass.jamb.gov.ng/e-syllabus';
const ENGLISH_SYLLABUS = 'https://ibass.jamb.gov.ng/assets/uploads/Use-of-English.pdf';
const SUBJECTS = new Set(['mathematics', 'english']);
const PUBLIC_FIELDS = ['id', 'subject', 'year', 'num', 'topic', 'question', 'passage', 'options', 'answer', 'explanation'];

function assert(condition, message) { if (!condition) throw new Error(message); }
function validate(source) {
  assert(source?.schema_version === 1 && source.collection_id === 'afrotools-original-jamb-practice-v1', 'Invalid original-practice manifest');
  assert(source.provenance?.includes('Original AfroTools practice'), 'Missing original-work provenance');
  assert(source.official_syllabus_portal === OFFICIAL_PORTAL && source.learning_objective_origin?.includes('authored by AfroTools'), 'Missing authored learning-objective or portal reference metadata');
  assert(source.mathematics_alignment_review?.status === 'unverified', 'Mathematics alignment must remain unverified until the official document can be checked');
  assert(source.english_alignment_review?.status === 'verified-topics' && source.english_alignment_review.official_document === ENGLISH_SYLLABUS,
    'Missing official Use of English topic-alignment evidence');
  assert(Array.isArray(source.questions) && source.questions.length >= 24, 'Original practice needs at least 24 reviewed items');
  const ids = new Set();
  const fingerprints = new Set();
  const prompts = new Set();
  const bySubject = { mathematics: 0, english: 0 };
  for (const q of source.questions) {
    assert(q && typeof q === 'object' && SUBJECTS.has(q.subject), 'Unsupported original-practice subject');
    assert(typeof q.id === 'string' && /^ato-(math|english)-v1-\d{2}$/.test(q.id) && !ids.has(q.id), 'Invalid or duplicate item ID: ' + q.id);
    ids.add(q.id);
    bySubject[q.subject]++;
    assert(q.year === null && q.num === null && !Object.hasOwn(q, 'source_provenance'), 'Original practice cannot have a historical sitting: ' + q.id);
    assert(q.origin === 'AfroTools original' && q.official_syllabus_portal === OFFICIAL_PORTAL, 'Missing authored provenance or official portal reference: ' + q.id);
    assert(typeof q.topic === 'string' && q.topic.trim() && typeof q.learning_objective === 'string' && q.learning_objective.trim() && !Object.hasOwn(q, 'objective'), 'Missing AfroTools-authored learning objective: ' + q.id);
    assert(typeof q.question === 'string' && q.question.length >= 20 && typeof q.explanation === 'string' && q.explanation.length >= 30, 'Incomplete question or explanation: ' + q.id);
    const prompt = q.question.trim().replace(/\s+/g, ' ').toLowerCase();
    assert(!prompts.has(prompt), 'Repeated question prompt: ' + q.id);
    prompts.add(prompt);
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
  assert(bySubject.mathematics >= 12 && bySubject.english >= 12, 'Each subject needs at least 12 items for a full session');
  for (const [subject, prefix] of [['mathematics', 'math'], ['english', 'english']]) {
    for (let number = 1; number <= bySubject[subject]; number++) {
      assert(ids.has('ato-' + prefix + '-v1-' + String(number).padStart(2, '0')), 'Missing sequential item for ' + subject + ': ' + number);
    }
  }
  return source;
}

function publicQuestion(q) {
  return reviewed({ ...Object.fromEntries(PUBLIC_FIELDS.filter(key => Object.hasOwn(q, key)).map(key => [key, q[key]])), format: 4 });
}
function publications(source) {
  validate(source);
  const revision = questionFingerprint(source);
  const questions = source.questions.map(publicQuestion);
  const subjects = { mathematics: questions.filter(q => q.subject === 'mathematics').length,
    english: questions.filter(q => q.subject === 'english').length };
  const provenance = 'AfroTools original practice questions; independent of JAMB and not a past-question collection.';
  const outputs = {
    [OUTPUT]: seal({ kind: 'original-practice', collection_id: source.collection_id,
      count: questions.length, answered_count: questions.length, provenance, questions }, revision),
    [INDEX]: seal({ kind: 'original-practice', collection_id: source.collection_id,
      count: questions.length, subjects, provenance }, revision)
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
  return { items: source.questions.length, subjects: outputs[INDEX].subjects, outputs: Object.keys(outputs) };
}

if (require.main === module) console.log(JSON.stringify(build(ROOT, process.argv.includes('--check'))));
module.exports = { validate, publicQuestion, publications, build, SOURCE, OUTPUT, INDEX };
