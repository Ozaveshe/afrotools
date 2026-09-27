'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const { validate, publicQuestion, publications } = require('../scripts/build-jamb-original-practice');
const { seal } = require('../scripts/lib/jamb-publication');
const { questionFingerprint } = require('../scripts/lib/jamb-content-trust');

const ROOT = path.resolve(__dirname, '..');
const source = validate(require('../ops/nigeria-exams/jamb-original-practice-v1.json'));
const rows = source.questions.map(publicQuestion);
const revision = questionFingerprint(source);
const subjectCounts = { mathematics: source.questions.filter(q => q.subject === 'mathematics').length,
  english: source.questions.filter(q => q.subject === 'english').length };
const pool = seal({ kind: 'original-practice', collection_id: source.collection_id,
  count: rows.length, answered_count: rows.length, questions: rows }, revision);
const index = seal({ kind: 'original-practice', collection_id: source.collection_id,
  count: rows.length, subjects: subjectCounts }, revision);

test('all 64 items are original, yearless and answer-reviewed without changing the historical pool', () => {
  assert.equal(source.questions.length, 64);
  assert.deepEqual(source.questions.reduce((counts, item) => { counts[item.subject] = (counts[item.subject] || 0) + 1; return counts; }, {}),
    { mathematics: 32, english: 32 });
  assert.ok(source.questions.every(item => item.year === null && item.num === null && item.origin === 'AfroTools original'));
  assert.ok(source.questions.every(item => item.options[item.answer] && item.review.independent_check && item.review.content_sha256));
  assert.equal(source.mathematics_alignment_review.status, 'unverified');
  assert.ok(source.questions.every(item => item.learning_objective && !Object.hasOwn(item, 'objective') && item.official_syllabus_portal === source.official_syllabus_portal));
  assert.ok(!source.questions.some(item => Object.hasOwn(item, 'source_provenance')));
  const historical = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/jamb/pools/practice-pool.json'), 'utf8'));
  assert.ok(!historical.questions.some(item => item.id.startsWith('ato-')));
  const normalize = value => value.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const historicalPrompts = new Set(historical.questions.map(item => normalize(item.question)));
  assert.ok(source.questions.filter(item => Number(item.id.slice(-2)) >= 13)
    .every(item => !historicalPrompts.has(normalize(item.question))));
  assert.ok(!fs.readFileSync(path.join(ROOT, 'jamb/index.html'), 'utf8').includes('/null/'));
  const route = fs.readFileSync(path.join(ROOT, 'jamb/original-practice/index.html'), 'utf8');
  assert.ok(route.includes('https://ibass.jamb.gov.ng/e-syllabus'));
  assert.ok(!route.includes('Mathematics.pdf') && !/syllabus-aligned|aligned with JAMB syllabus/i.test(route));
  const published = publications(source).outputs['data/jamb/pools/original-practice.json'];
  assert.match(published.provenance, /AfroTools original practice questions/);
  assert.doesNotMatch(published.provenance, /syllabus-aligned|aligned with JAMB syllabus/i);
  assert.equal(source.english_alignment_review.status, 'unverified');
  assert.equal(source.english_alignment_review.direct_pdf_attempted, 'https://ibass.jamb.gov.ng/assets/uploads/Use-of-English.pdf');
});

test('an altered answer, wording or invented year invalidates the original review', () => {
  for (const change of [
    item => { item.answer = 'A'; },
    item => { item.question += ' Changed'; },
    item => { item.year = 2025; }
  ]) {
    const copy = JSON.parse(JSON.stringify(source));
    change(copy.questions[0]);
    assert.throws(() => validate(copy));
  }
});

test('the first Maths answer keys match independent calculations and inverses', () => {
  const expected = [
    32 + 8 + 4 + 1, 64 * 3 / 8, 8000 * .85, 4, '3 and 4', 5 + 11 * 4,
    2 * 3 ** 4, '(2, 2)', .5 * 12 * 7, 1, 3 / 10, 7
  ];
  source.questions.filter(q => q.subject === 'mathematics').slice(0, 12).forEach((q, i) => {
    const selected = q.options[q.answer];
    if (typeof expected[i] === 'number') {
      const numeric = selected.replace(/[^0-9./-]/g, '');
      const value = numeric.includes('/') ? numeric.split('/').map(Number).reduce((a, b) => a / b) : Number(numeric);
      assert.equal(value, expected[i], q.id);
    } else assert.equal(selected, expected[i], q.id);
  });
});

test('the next Maths answers follow independent set, logarithm and graph calculations', () => {
  const next = source.questions.filter(q => q.subject === 'mathematics').slice(12, 20);
  assert.deepEqual(next.map(q => q.id), Array.from({ length: 8 }, (_, i) => 'ato-math-v1-' + String(i + 13).padStart(2, '0')));
  assert.deepEqual(next.map(q => q.options[q.answer]),
    ['11', '{1, 7}', '6', '3', '10', '2', 'Wednesday to Thursday', 'The traveller stayed at the same distance for five minutes']);
  assert.equal(Number(next[0].options[next[0].answer]), 22 + 18 - (36 - 7));
  assert.equal(next[1].options[next[1].answer], '{' + [1, 2, 4, 7].filter(value => ![2, 3, 4, 6].includes(value)).join(', ') + '}');
  const pairs = [];
  for (let a = 0; a < 4; a++) for (let b = a + 1; b < 4; b++) pairs.push([a, b]);
  assert.equal(Number(next[2].options[next[2].answer]), pairs.length);
  assert.equal(Number(next[3].options[next[3].answer]), Math.log2(32) - Math.log2(4));
  assert.equal(Number(next[4].options[next[4].answer]), 3 ** 2 + 1);
  assert.equal(Number(next[5].options[next[5].answer]), Math.round(Math.log(125) / Math.log(5) + Math.log(1 / 5) / Math.log(5)));
  const visits = [...next[6].passage.matchAll(/(?:Monday|Tuesday|Wednesday|Thursday) (\d+)/g)].map(match => Number(match[1]));
  const changes = visits.slice(1).map((value, i) => value - visits[i]);
  assert.deepEqual(changes, [6, -3, 10]);
  assert.equal(changes.indexOf(Math.max(...changes)), 2);
  assert.match(next[7].passage, /total distance travelled/);
  assert.equal((4 - 4) / (15 - 10), 0);
  assert.ok(next.slice(6).every(q => q.passage && q.explanation && q.review.independent_check));
  assert.ok(next.every(q => q.year === null && q.num === null && q.origin === 'AfroTools original'));
});

test('the third Maths batch has independently recomputed keys and accessible graph scales', () => {
  const next = source.questions.filter(q => q.subject === 'mathematics').slice(20);
  assert.deepEqual(next.map(q => q.id), Array.from({ length: 12 }, (_, i) =>
    'ato-math-v1-' + String(i + 21).padStart(2, '0')));
  assert.deepEqual(next.map(q => q.options[q.answer]), [
    String(2 * 4 + 3 * 5), String(6 ** 2 - (2 ** 2 - 3)), String((13 + 2 * 4) / 3),
    String(9 * 8 / 12), (6 * 15 / 10) + ' hours', String(14 + 6 * -3).replace('-', '−'),
    ['First', 'Second', 'Third', 'Fourth', 'Fifth', 'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth'][(58 - 4) / 6],
    String([3, 7, 11, 15, 19, 23, 27, 31].reduce((sum, value) => sum + value, 0)),
    ((30 - 18) / (5 - 2)) + ' parcels per minute', (4 * 5) + ' books',
    Number(0.004867).toPrecision(2), '7.86 × 10⁴'
  ]);
  assert.ok(next.slice(8, 10).every(q => q.passage && /horizontal axis|vertical axis/.test(q.passage)));
  assert.ok(next.every(q => q.review.independent_check.length >= 30 && q.year === null && q.num === null));
});

test('English comprehension is grounded in the authored passage and all lexical keys are unique', () => {
  const english = source.questions.filter(q => q.subject === 'english');
  const passage = english[0].passage;
  assert.ok(passage.includes('power supply is unreliable'));
  assert.ok(passage.includes('solar panel'));
  assert.ok(passage.includes('service fair'));
  assert.ok(passage.includes('did not solve every study problem'));
  assert.ok(english.slice(0, 4).every(q => q.passage === passage));
  assert.ok(english.slice(4, 17).every(q => !q.passage));
  assert.deepEqual(english.slice(0, 12).map(q => q.options[q.answer]), [
    'They need light for evening study when power is unreliable.',
    'To charge returned lamps before lending them again.',
    'Demand had grown and the team wanted fair access.',
    'It helped some pupils study, though other problems remained.',
    'is', 'had packed', 'would have arrived', 'into', 'short', 'unwilling', 'plentiful', 'shrink'
  ]);
});

test('the next English batch covers oral forms and one complete original cloze passage', () => {
  const next = source.questions.filter(q => q.subject === 'english').slice(12, 20);
  assert.deepEqual(next.map(q => q.id), Array.from({ length: 8 }, (_, i) => 'ato-english-v1-' + String(i + 13).padStart(2, '0')));
  assert.deepEqual(next.map(q => q.options[q.answer]),
    ['seen', 'sprint', 'site', 'relax', 'The colour of the folder', 'evaporate', 'compared', 'based']);
  assert.ok(next.slice(0, 5).every(q => q.topic.startsWith('Oral forms:') && !q.passage));
  assert.match(next[4].question, /the word 'blue' receives emphatic stress/i);
  const cloze = next.slice(5);
  assert.ok(cloze.every(q => q.topic.startsWith('Cloze:') && q.passage === cloze[0].passage));
  assert.ok(cloze[0].passage.split(/\s+/).length >= 190 && cloze[0].passage.split(/\s+/).length <= 210);
  assert.ok(cloze.every((q, i) => q.passage.includes('___(' + (i + 1) + ')___') && q.review.independent_check.length >= 30));
  assert.ok(next.every(q => q.year === null && q.num === null && q.origin === 'AfroTools original'));
  assert.equal(new Set(next.map(q => q.question.toLowerCase())).size, 8);
});

test('the third English batch has two complete passages and independently checked oral items', () => {
  const next = source.questions.filter(q => q.subject === 'english').slice(20);
  assert.deepEqual(next.map(q => q.id), Array.from({ length: 12 }, (_, i) =>
    'ato-english-v1-' + String(i + 21).padStart(2, '0')));
  assert.deepEqual(next.map(q => q.options[q.answer]), [
    'It remained usable when the stepping stones were covered.',
    'New pupils needed the directions before they reached the school gate.',
    'The footbridge recommendation may not have been the only cause.',
    'The better route could depend on weather conditions.',
    'recorded', 'correct', 'improvement', 'discrepancy',
    'leaf', 'We record the rainfall each day.', 'Ngozi gave away five rulers to Idris.', 'Did the bus arrive?'
  ]);
  assert.ok(next.slice(0, 4).every(q => q.passage === next[0].passage));
  assert.match(next[0].passage, /four rainy mornings nobody could use them/);
  assert.match(next[0].passage, /new bus timetable/);
  assert.ok(next.slice(4, 8).every(q => q.passage === next[4].passage));
  for (let number = 1; number <= 4; number++) assert.ok(next[4].passage.includes('___(' + number + ')___'));
  assert.ok(next.slice(8).every(q => !q.passage && q.topic.startsWith('Oral forms:')));
  assert.ok([next[8], next[9], next[11]].every(q => q.review.evidence_urls?.length > 0));
  assert.ok(next.every(q => q.year === null && q.num === null && q.review.independent_check.length >= 30));
});

test('the original CBT trusts its own index, isolates its resume key and never posts a mock attempt', async () => {
  const storage = new Map();
  const posts = [];
  const context = { crypto: webcrypto, TextEncoder, Date,
    fetch: async (url, options) => {
      if (options?.method === 'POST') { posts.push(url); return { ok: true }; }
      return { ok: true, json: async () => JSON.parse(JSON.stringify(url.endsWith('original-practice-index.json') ? index : pool)) };
    },
    localStorage: { getItem: key => storage.get(key) || null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    setInterval: () => 1, clearInterval: () => {}
  };
  context.window = context;
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'assets/js/lib/jamb-question-trust.js'), 'utf8'), context);
  const loaded = await context.AfroJAMB.QuestionTrust.loadPool('/data/jamb/pools/original-practice.json', '/data/jamb/pools/original-practice-index.json');
  vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'engines/src/jamb-cbt-engine.js'), 'utf8'), context);
  const cbt = context.AfroJAMB.CBT;
  const config = { pool: loaded.questions, poolRevision: loaded.review_revision, subjects: ['mathematics'], mode: 'original-practice', questionsPerSubject: 12, durationMinutes: 20 };
  assert.equal(cbt.selectQuestions(config).length, 12);
  cbt.init(config);
  assert.ok(storage.has('afrojamb-original-cbt-state-v1'));
  assert.ok(!storage.has('afrojamb-cbt-state'));
  const first = cbt.getCurrentQuestion();
  cbt.selectAnswer(first.question.answer);
  assert.equal(cbt.tryRestore('original-practice').mode, 'original-practice');
  const result = cbt.submit();
  assert.equal(result.total, 1);
  assert.equal(result.outOf, 12);
  assert.equal(result.aggregate, null);
  assert.equal(posts.length, 0);
  assert.ok(!storage.has('afrojamb-original-cbt-state-v1'));
});
