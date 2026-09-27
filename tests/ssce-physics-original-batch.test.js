'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const english = require('../assets/js/lib/ssce-practice-bank');
const practice = require('../assets/js/lib/ssce-practice');
const { quickBank } = require('../scripts/build-ssce-practice-locales');

const expected = {
  p13: { value: (8 - 0) / (4 - 0), unit: 'm/s²' },
  p14: { value: 3 * 6 / 2 + (7 - 3) * 6, unit: 'm' },
  p15: { value: (17 - 2) / (5 - 0), unit: 'm/s' },
  p16: { value: 2 / (1 / 100), unit: 'N/m' },
  p17: { value: (120 + 80) / (20 + 20), unit: 'm/s' },
  p18: { value: 12 - 5, unit: 'N east' },
  p19: { value: 3 * 4, unit: 'N' },
  p20: { value: (20 - 8) / 4, unit: 'm/s²' },
  p21: { value: 2 + 4, unit: 'Ω' },
  p22: { value: 1 / (1 / 6 + 1 / 3), unit: 'Ω' },
  p23: { value: 0.25 * 40, unit: 'C' },
  p24: { value: 12 * 2 * 30, unit: 'J' }
};

test('each new original Physics key agrees with an independent calculation and has one valid choice', () => {
  assert.equal(english.questions.filter(q => q.subject === 'Physics').length, 24);
  for (const [id, { value, unit }] of Object.entries(expected)) {
    const q = english.questions.find(item => item.id === id);
    assert.ok(q, id);
    assert.equal(q.examYear, null, id);
    assert.equal(q.origin, 'AfroTools original practice', id);
    assert.equal(q.options[q.answer], `${value} ${unit}`, id);
    assert.equal(q.options.filter(option => option === `${value} ${unit}`).length, 1, id);
    assert.ok(q.steps.some(step => step.includes(String(value))), id);
    assert.ok(q.pitfall.length > 20, id);
  }
});

test('graph and tabular data are fully described in text for nonvisual reading', () => {
  for (const id of ['p13', 'p14', 'p15']) {
    const prompt = english.questions.find(q => q.id === id).prompt;
    assert.match(prompt, /horizontal|horizontally/, id);
    assert.match(prompt, /vertical|vertically/, id);
    assert.match(prompt, /\(0 s,/, id);
    assert.match(prompt, /m\/s|metres/, id);
  }
  const spring = english.questions.find(q => q.id === 'p16').prompt;
  assert.match(spring, /force \(N\): 0, 2, 4, 6/);
  assert.match(spring, /extension \(cm\): 0, 1, 2, 3/);
  assert.match(english.questions.find(q => q.id === 'p14').prompt, /Velocity is never negative/);
});

test('new guidance links follow the item topic', () => {
  const guidance = Object.fromEntries(english.questions.filter(q => q.subject === 'Physics').map(q => [q.id, q.guidanceUrl]));
  assert.match(guidance.p13, /Phys228mw\.html$/);
  assert.match(guidance.p16, /Phys3224mw\.html$/);
  assert.match(guidance.p17, /2-2-speed-and-velocity$/);
  for (const id of ['p18', 'p19', 'p20']) assert.match(guidance[id], /4-3-newtons-second-law-of-motion$/);
});

test('French and Swahili retain the English assessment and localize every new explanation', () => {
  for (const locale of ['fr', 'sw']) {
    const bank = quickBank(locale);
    for (const id of Object.keys(expected)) {
      const source = english.questions.find(q => q.id === id);
      const q = bank.questions.find(item => item.id === id);
      assert.ok(q, `${locale}/${id}`);
      assert.equal(q.prompt, source.prompt);
      assert.deepEqual(q.options, source.options);
      assert.equal(q.questionLanguage, 'en');
      assert.notDeepEqual(q.steps, source.steps);
      assert.notEqual(q.pitfall, source.pitfall);
      assert.ok(bank.ui[q.topic], `${locale}/${q.topic}`);
    }
  }
});

test('Physics practice exports use an accurate generic title in every locale', () => {
  for (const [locale, title] of [['en', 'AfroTools practice'], ['fr', 'Entraînement AfroTools'], ['sw', 'Mazoezi ya AfroTools']]) {
    const bank = locale === 'en' ? english : quickBank(locale);
    let state = practice.start(bank, 'Physics', 'Motion graphs');
    state = practice.answer(state, bank.questions.find(q => q.id === state.ids[0]).answer, bank);
    const report = practice.report(state, bank);
    assert.equal(report.split('\n')[0], title, locale);
    assert.ok(report.includes(bank.questions.find(q => q.id === 'p13').prompt), locale);
  }
});
