'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const bank = require('../assets/js/lib/ssce-written-bank');
const written = require('../assets/js/lib/ssce-written');
const { writtenBank } = require('../scripts/build-ssce-practice-locales');

const ids = ['written-e-library-comprehension', 'written-e-library-summary', 'written-e-library-letter'];
const tasks = ids.map(id => bank.items.find(item => item.id === id));

test('the new English unit is complete, original and yearless', () => {
  assert.ok(tasks.every(Boolean));
  assert.equal(new Set(bank.items.map(item => item.id)).size, bank.items.length);
  assert.equal(bank.items.filter(item => item.subject === 'English' && item.origin === 'AfroTools original exercise').length, 5);
  assert.deepEqual(
    bank.items.filter(item => item.subject === 'English' && item.origin === 'AfroTools original exercise').map(item => item.id).sort(),
    ['written-e-comprehension', 'written-e-summary', 'written-e-library-comprehension', 'written-e-library-summary', 'written-e-library-letter'].sort()
  );
  for (const task of tasks) {
    assert.equal(task.exam, null);
    assert.equal(task.year, null);
    assert.equal(task.paper, null);
    assert.equal(task.number, null);
    assert.equal(task.collection, 'English written practice');
    assert.match(task.source, /^https:\/\/www\.waeconline\.org\.ng\/e-learning\/English\//);
    assert.match(task.sourceUse, /Guidance only.*original AfroTools material/);
    assert.ok(task.steps.length >= 3);
    assert.equal(task.checks.length, 3);
  }
  assert.match(bank.scope, /5 original English tasks/);
});

test('every suggested reading answer is grounded in the complete original passage', () => {
  const [comprehension, summary] = tasks;
  const passage = comprehension.passage;
  assert.equal(summary.passage, passage);
  assert.ok(passage.split(/\s+/).length >= 200);
  assert.equal(passage.split(/\n\s*\n/).length, 3);
  assert.match(passage, /students were no longer interested in books/i);
  assert.match(comprehension.answer, /no longer interested in books/i);
  for (const detail of ['school bus', 'younger siblings']) {
    assert.ok(passage.includes(detail), `passage omits ${detail}`);
    assert.ok(comprehension.answer.includes(detail), `answer omits ${detail}`);
  }
  assert.match(passage, /lunchtime count was consistently higher/i);
  assert.match(comprehension.answer, /more visitors at lunch than after school/i);
  assert.match(passage, /loans had risen.*after-school chairs were still mostly empty/i);
  assert.match(comprehension.answer, /room looked after school.*access reading/i);
  assert.match(passage, /forms.*came back from only a few students/i);
  assert.match(comprehension.answer, /Only a few borrowers returned forms/i);
  assert.match(passage, /postponed a final decision/i);
  assert.match(comprehension.answer, /Delayed/);
  for (const part of 'abcdef') assert.match(comprehension.answer, new RegExp('\\(' + part + '\\)'));
  const summarySentences = summary.answer.match(/[^.!?]+[.!?]/g) || [];
  assert.equal(summarySentences.length, 3);
  for (const action of ['lunchtime', 'weekend', 'canteen']) {
    assert.ok(passage.includes(action), `passage omits ${action}`);
    assert.ok(summary.answer.includes(action), `summary omits ${action}`);
  }
});

test('the related letter has a realistic task and existing local save and report flow', () => {
  const letter = tasks[2];
  assert.match(letter.prompt, /two affordable ways.*evidence/i);
  assert.match(letter.answer, /practice, not an official WAEC or NECO requirement/i);
  assert.equal(letter.passage, undefined);
  const saved = new Map();
  const storage = { getItem: key => saved.get(key) || null, setItem: (key, value) => saved.set(key, value) };
  written.write(storage, bank, letter.id, { answer: 'Synthetic sample letter for local flow.', checks: [true, false, true] });
  const state = written.read(storage, bank);
  assert.equal(state.entries[letter.id].answer, 'Synthetic sample letter for local flow.');
  const report = written.report(bank, state);
  assert.match(report, /Synthetic sample letter for local flow/);
  assert.match(report, /This letter prompt and self-review guide are original AfroTools material/);
  const html = fs.readFileSync(path.join(__dirname, '../tools/ssce-practice/index.html'), 'utf8');
  for (const id of ids) assert.ok(html.includes('#written=' + id), `missing deep link for ${id}`);
});

test('French and Swahili guidance retains English assessment text and backup identity', () => {
  for (const locale of ['fr', 'sw']) {
    const localized = writtenBank(locale);
    assert.equal(localized.id, bank.id);
    assert.equal(localized.items.length, bank.items.length);
    assert.match(localized.scope, locale === 'fr' ? /5 d’anglais/ : /5 za Kiingereza/);
    for (const source of tasks) {
      const translated = localized.items.find(item => item.id === source.id);
      assert.ok(translated);
      assert.equal(translated.passage, source.passage);
      assert.equal(translated.prompt, source.prompt);
      assert.equal(translated.answer, source.answer);
      assert.equal(translated.questionLanguage, 'en');
      assert.equal(translated.answerLanguage, 'en');
      assert.equal(translated.checks.length, source.checks.length);
      assert.notDeepEqual(translated.steps, source.steps);
      assert.notEqual(translated.sourceUse, source.sourceUse);
    }
  }
});
