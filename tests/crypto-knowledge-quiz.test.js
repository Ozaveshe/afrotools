'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const bank = require('../assets/js/data/crypto-quiz-bank.js');
const engine = require('../assets/js/engines/crypto-knowledge-quiz.js');

function clone(value) { return JSON.parse(JSON.stringify(value)); }

test('reviewed EN/FR quiz bank validates as a complete durable contract', () => {
  const result = engine.validateBank(bank, { asOf: '2026-07-23' });
  assert.equal(result.ok, true);
  assert.equal(bank.sets.length, 2);
  assert.deepEqual(bank.sets.map((set) => set.questions.length), [6, 6]);
  assert.ok(new Set(bank.sets.flatMap((set) => set.questions.map((question) => question.answer))).size >= 3);
  assert.ok(bank.sets.every((set) => set.questions.every((question) =>
    question.status === 'durable' &&
    question.topic.en && question.topic.fr &&
    question.source.url.startsWith('https://') &&
    question.source.reviewedAt === '2026-07-23'
  )));
});

test('bank validation fails closed on impossible and future dates', () => {
  const impossibleBank = clone(bank);
  impossibleBank.reviewedAt = '2026-02-30';
  assert.equal(engine.validateBank(impossibleBank, { asOf: '2026-07-23' }).ok, false);

  const impossibleSource = clone(bank);
  impossibleSource.sets[0].questions[0].source.reviewedAt = '2026-04-31';
  assert.equal(engine.validateBank(impossibleSource, { asOf: '2026-07-23' }).ok, false);

  const futureSource = clone(bank);
  futureSource.sets[0].questions[0].source.reviewedAt = '2026-07-24';
  assert.equal(engine.validateBank(futureSource, { asOf: '2026-07-23' }).ok, false);
});

test('bank validation rejects duplicate ids, missing French topics and unsafe sources', () => {
  const duplicate = clone(bank);
  duplicate.sets[1].questions[0].id = duplicate.sets[0].questions[0].id;
  assert.equal(engine.validateBank(duplicate, { asOf: '2026-07-23' }).ok, false);

  const missingFrenchTopic = clone(bank);
  missingFrenchTopic.sets[0].questions[0].topic.fr = '';
  assert.equal(engine.validateBank(missingFrenchTopic, { asOf: '2026-07-23' }).ok, false);

  const unsafe = clone(bank);
  unsafe.sets[0].questions[0].source.url = 'http://example.com/source';
  assert.equal(engine.validateBank(unsafe, { asOf: '2026-07-23' }).ok, false);
});

test('scoring requires a complete valid answer set and preserves localized topics', () => {
  const set = bank.sets[0];
  assert.throws(() => engine.score(set, []), /complete answer set/);
  assert.throws(() => engine.score(set, set.questions.map(() => 99)), /answer is invalid/);
  const answers = set.questions.map((question) => question.answer);
  const result = engine.score(set, answers);
  assert.equal(result.correct, 6);
  assert.equal(result.total, 6);
  assert.equal(result.topics.Networks.label.fr, 'Réseaux');
});

test('EN and FR text exports contain only completed review facts and sources', () => {
  const set = bank.sets[0];
  const result = engine.score(set, set.questions.map((question) => question.answer));
  const en = engine.toText(result, 'en', bank.boundary);
  const fr = engine.toText(result, 'fr', bank.boundary);
  assert.match(en, /Exact score: 6 \/ 6/);
  assert.match(en, /Bitcoin\.org/);
  assert.match(fr, /Score exact: 6 \/ 6/);
  assert.match(fr, /Réseaux/);
  assert.match(fr, /Révisé le: 2026-07-23/);
  assert.doesNotMatch(en + fr, /(?:^|\n)(?:name|email|wallet address|holdings|transaction id)\s*:/im);
});
